import { CustomBlock } from "../notes/editorSpecs";
import { Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import { Tag, TAG_TYPES } from "./types";
import { Block } from "../notes/types";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { Ctx } from "../common/types";

//TODO: make some of these internal mutations/queries
//TODO: look into WithoutSystemFields

export const insertTag = async (
  ctx: MutationCtx,
  tag: Omit<Tag, "_id" | "_creationTime" | "updatedAt">,
): Promise<Id<"tags">> => {
  await requireCampaignMembership(ctx, { campaignId: tag.campaignId },
    { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
  );

  const tagId = await ctx.db.insert("tags", {
    name: tag.name,
    type: tag.type,
    color: tag.color,
    campaignId: tag.campaignId,
    updatedAt: Date.now(),
  });

  return tagId;
};

export const insertUserCreatedTag = async (
  ctx: MutationCtx,
  tag: Omit<Tag, "_id" | "_creationTime" | "updatedAt">,
): Promise<{ tagId: Id<"tags">, noteId: Id<"notes"> }> => {
  if (tag.type === TAG_TYPES.System) {
    throw new Error("User cannot create system tags");
  }

  const { identityWithProfile } = await requireCampaignMembership(ctx, { campaignId: tag.campaignId },
    { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
  );
  const { profile } = identityWithProfile;

  const tagId = await insertTag(ctx, tag);

  // Create associated note page for user-created tags
  const noteId = await ctx.db.insert("notes", {
    userId: profile.userId,
    name: tag.name,
    campaignId: tag.campaignId,
    tagId: tagId,
    updatedAt: Date.now(),
  });

  // Create initial block for the note
  const initialBlockId = crypto.randomUUID();
  await ctx.db.insert("blocks", {
    noteId,
    blockId: initialBlockId,
    position: 0,
    content: {
      type: "paragraph",
      id: initialBlockId,
      content: [],
    },
    isTopLevel: true,
    campaignId: tag.campaignId,
    updatedAt: Date.now(),
  });
  

  return { tagId, noteId };
};

export const updateTagAndContent = async (
  ctx: MutationCtx,
  tagId: Id<"tags">,
  campaignId: Id<"campaigns">,
  currentName: string,
  currentColor: string,
  updates: {
    name?: string;
    color?: string;
  },
) => {
  await requireCampaignMembership(ctx, { campaignId: campaignId },
    { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
  );

  const tagUpdates: {
    name?: string;
    color?: string;
    updatedAt: number;
  } = {
    updatedAt: Date.now(),
  };

  if (updates.name !== undefined) {
    tagUpdates.name = updates.name;
  }
  if (updates.color !== undefined) {
    tagUpdates.color = updates.color;
  }

  await ctx.db.patch(tagId, tagUpdates);

  if (updates.name !== undefined || updates.color !== undefined) {
    const newName = updates.name ?? currentName;
    const newColor = updates.color ?? currentColor;

    const allBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign_note_toplevel_pos", (q) =>
        q.eq("campaignId", campaignId),
      )
      .collect();

    const updateTagsInContent = (content: any): any => {
      if (Array.isArray(content)) {
        return content.map(updateTagsInContent);
      } else if (content && typeof content === "object") {
        if (content.type === "tag" && content.props?.tagId === tagId) {
          return {
            ...content,
            props: {
              ...content.props,
              tagName: newName,
              tagColor: newColor,
            },
          };
        }

        const updatedContent = { ...content };
        if (content.content) {
          updatedContent.content = updateTagsInContent(content.content);
        }
        if (content.children) {
          updatedContent.children = updateTagsInContent(content.children);
        }

        return updatedContent;
      }
      return content;
    };

    for (const block of allBlocks) {
      const updatedContent = updateTagsInContent(block.content);

      if (JSON.stringify(updatedContent) !== JSON.stringify(block.content)) {
        await ctx.db.patch(block._id, {
          content: updatedContent,
          updatedAt: Date.now(),
        });
      }
    }
  }
};

export const deleteTagAndCleanupContent = async (
  ctx: MutationCtx,
  tagId: Id<"tags">,
) => {
  //TODO: modify all tags in content to just be text without being an actual tag inline content
  await ctx.db.delete(tagId);
};

export async function validateTagBelongsToCampaign(
  ctx: Ctx,
  tagId: Id<"tags">,
  campaignId: Id<"campaigns">,
): Promise<Tag> {
  await requireCampaignMembership(ctx, { campaignId: campaignId },
    { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
  );

  const tag = await ctx.db.get(tagId);
  if (!tag) {
    throw new Error("Tag not found");
  }

  if (tag.campaignId !== campaignId) {
    throw new Error("Tag does not belong to the specified campaign");
  }

  return tag;
}

export async function findBlock(
  ctx: Ctx,
  noteId: Id<"notes">,
  blockId: string,
): Promise<Block | null> {
  const note = await ctx.db.get(noteId);
  if (!note) {
    return null;
  }

  return await ctx.db
    .query("blocks")
    .withIndex("by_campaign_note_block", (q) =>
      q
        .eq("campaignId", note.campaignId)
        .eq("noteId", noteId)
        .eq("blockId", blockId),
    )
    .unique();
}

export async function getBlockTags(
  ctx: Ctx,
  blockDbId: Id<"blocks">,
): Promise<Id<"tags">[]> {
  const block = await ctx.db.get(blockDbId);
  if (!block) {
    return [];
  }

  const blockTags = await ctx.db
    .query("blockTags")
    .withIndex("by_campaign_block_tag", (q) =>
      q.eq("campaignId", block.campaignId).eq("blockId", blockDbId),
    )
    .collect();

  return blockTags.map((bt) => bt.tagId);
}

export async function addTagToBlock(
  ctx: MutationCtx,
  blockDbId: Id<"blocks">,
  tagId: Id<"tags">,
) {
  const block = await ctx.db.get(blockDbId);
  if (!block) {
    return [];
  }

  const existing = await ctx.db
    .query("blockTags")
    .withIndex("by_campaign_block_tag", (q) =>
      q
        .eq("campaignId", block.campaignId)
        .eq("blockId", blockDbId)
        .eq("tagId", tagId),
    )
    .unique();

  if (!existing) {
    await ctx.db.insert("blockTags", {
      campaignId: block.campaignId,
      blockId: blockDbId,
      tagId: tagId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(blockDbId, {
      updatedAt: Date.now(),
    });
  }
  return blockDbId;
}

export async function removeTagFromBlock(
  ctx: MutationCtx,
  blockDbId: Id<"blocks">,
  tagIdToRemove: Id<"tags">,
  isTopLevel: boolean,
) {
  const block = await ctx.db.get(blockDbId);
  if (!block) {
    return [];
  }

  const blockTag = await ctx.db
    .query("blockTags")
    .withIndex("by_campaign_block_tag", (q) =>
      q
        .eq("campaignId", block.campaignId)
        .eq("blockId", blockDbId)
        .eq("tagId", tagIdToRemove),
    )
    .unique();

  if (blockTag) {
    await ctx.db.delete(blockTag._id);
  }

  const remainingTags = await getBlockTags(ctx, blockDbId);

  if (remainingTags.length === 0 && !isTopLevel) {
    await ctx.db.delete(blockDbId);
    return null;
  } else {
    await ctx.db.patch(blockDbId, {
      updatedAt: Date.now(),
    });
    return blockDbId;
  }
}

export async function getTopLevelBlocks(
  ctx: Ctx,
  noteId: Id<"notes">,
): Promise<Block[]> {
  const note = await ctx.db.get(noteId);
  if (!note) return [];

  const blocks = await ctx.db
    .query("blocks")
    .withIndex("by_campaign_note_toplevel_pos", (q) =>
      q
        .eq("campaignId", note.campaignId)
        .eq("noteId", noteId)
        .eq("isTopLevel", true),
    )
    .collect();

  return blocks;
}

export function extractAllBlocksWithTags(
  content: CustomBlock[],
  noteTagId: Id<"tags"> | null,
): Map<
  string,
  { block: CustomBlock; tagIds: Id<"tags">[]; isTopLevel: boolean }
> {
  const blocksMap = new Map<
    string,
    { block: CustomBlock; tagIds: Id<"tags">[]; isTopLevel: boolean }
  >();

  function traverseBlocks(blocks: any[], isTopLevel: boolean = false) {
    if (!Array.isArray(blocks)) return;

    blocks.forEach((block) => {
      if (block.id) {
        const tagIds = extractTagIdsFromBlockContent(block);

        if (isTopLevel || tagIds.length > 0 || noteTagId) {
          blocksMap.set(block.id, {
            block: block,
            tagIds: [...tagIds, ...(noteTagId ? [noteTagId] : [])],
            isTopLevel: isTopLevel,
          });
        }
      }

      if (block.children && Array.isArray(block.children)) {
        traverseBlocks(block.children, false);
      }
    });
  }

  traverseBlocks(content, true);
  return blocksMap;
}

export function extractTagIdsFromBlockContent(block: any): Id<"tags">[] {
  const tagIds: Id<"tags">[] = [];

  function traverseImmediate(content: any, depth: number = 0) {
    if (!content || depth > 2) return;

    if (Array.isArray(content)) {
      content.forEach((item) => traverseImmediate(item, depth + 1));
    } else if (typeof content === "object") {
      if (
        content.type === "tag" &&
        content.props?.tagId &&
        !tagIds.includes(content.props.tagId)
      ) {
        tagIds.push(content.props.tagId);
        return;
      }

      if (content.text !== undefined || content.type === "text") {
        Object.values(content).forEach((value) =>
          traverseImmediate(value, depth + 1),
        );
      } else if (content.content && !content.id) {
        traverseImmediate(content.content, depth + 1);
      }
    }
  }

  if (block.content) {
    traverseImmediate(block.content, 0);
  }

  return tagIds;
}

export async function saveTopLevelBlocks(
  ctx: MutationCtx,
  noteId: Id<"notes">,
  campaignId: Id<"campaigns">,
  content: CustomBlock[],
) {
  const now = Date.now();

  const note = await ctx.db.get(noteId);
  if (!note) return;

  const allBlocksWithTags = extractAllBlocksWithTags(
    content,
    note.tagId || null,
  );

  const existingBlocks = await ctx.db
    .query("blocks")
    .withIndex("by_campaign_note_toplevel_pos", (q) =>
      q.eq("campaignId", note.campaignId).eq("noteId", noteId),
    )
    .collect();

  const existingBlocksMap = new Map(
    existingBlocks.map((block) => [block.blockId, block]),
  );

  const processedBlockIds = new Set<string>();

  for (const [
    blockId,
    { block, tagIds: inlineTagIds, isTopLevel },
  ] of allBlocksWithTags) {
    processedBlockIds.add(blockId);
    const existingBlock = existingBlocksMap.get(blockId);

    let finalBlockDbId: Id<"blocks">;

    if (existingBlock) {
      await ctx.db.patch(existingBlock._id, {
        position: isTopLevel
          ? Array.from(allBlocksWithTags.entries())
              .filter(([_, data]) => data.isTopLevel)
              .findIndex(([id]) => id === blockId)
          : undefined,
        content: block,
        isTopLevel: isTopLevel,
        updatedAt: now,
      });
      finalBlockDbId = existingBlock._id;
    } else {
      finalBlockDbId = await ctx.db.insert("blocks", {
        noteId,
        blockId: blockId,
        position: isTopLevel
          ? Array.from(allBlocksWithTags.entries())
              .filter(([_, data]) => data.isTopLevel)
              .findIndex(([id]) => id === blockId)
          : undefined,
        content: block,
        isTopLevel: isTopLevel,
        campaignId,
        updatedAt: now,
      });
    }

    if (existingBlock) {
      const currentTagIds = await getBlockTags(ctx, finalBlockDbId);

      const oldInlineTagIds = existingBlock.content
        ? extractTagIdsFromBlockContent(existingBlock.content)
        : [];

      const manualTags = currentTagIds.filter(
        (tagId) => !oldInlineTagIds.includes(tagId),
      );

      const noteLevelTag = note.tagId ? [note.tagId] : [];
      const finalTagIds = [
        ...new Set([...inlineTagIds, ...manualTags, ...noteLevelTag]),
      ];

      const tagsToRemove = currentTagIds.filter(
        (tagId) => !finalTagIds.includes(tagId),
      );
      const tagsToAdd = finalTagIds.filter(
        (tagId) => !currentTagIds.includes(tagId),
      );

      for (const tagId of tagsToRemove) {
        const blockTag = await ctx.db
          .query("blockTags")
          .withIndex("by_campaign_block_tag", (q) =>
            q
              .eq("campaignId", campaignId)
              .eq("blockId", finalBlockDbId)
              .eq("tagId", tagId),
          )
          .unique();
        if (blockTag) {
          await ctx.db.delete(blockTag._id);
        }
      }

      for (const tagId of tagsToAdd) {
        await ctx.db.insert("blockTags", {
          campaignId: campaignId,
          blockId: finalBlockDbId,
          tagId: tagId,
          createdAt: now,
        });
      }
    } else {
      const noteLevelTag = note.tagId ? [note.tagId] : [];
      const finalTagIds = [...new Set([...inlineTagIds, ...noteLevelTag])];

      for (const tagId of finalTagIds) {
        await ctx.db.insert("blockTags", {
          campaignId: campaignId,
          blockId: finalBlockDbId,
          tagId: tagId,
          createdAt: now,
        });
      }
    }
  }

  for (const existingBlock of existingBlocks) {
    if (!processedBlockIds.has(existingBlock.blockId)) {
      const currentTagIds = await getBlockTags(ctx, existingBlock._id);

      if (currentTagIds.length === 0) {
        await ctx.db.delete(existingBlock._id);
      } else {
        await ctx.db.patch(existingBlock._id, {
          isTopLevel: false,
          position: undefined,
          updatedAt: now,
        });
      }
    }
  }
}

export function findBlockById(content: any, blockId: string): any | null {
  if (!Array.isArray(content)) return null;

  for (const block of content) {
    if (block.id === blockId) {
      return block;
    }

    if (block.children && Array.isArray(block.children)) {
      const found = findBlockById(block.children, blockId);
      if (found) return found;
    }
  }
  return null;
}

export function extractAllBlockIds(content: any): string[] {
  const blockIds: string[] = [];

  function traverse(items: any) {
    if (!items) return;

    if (Array.isArray(items)) {
      items.forEach(traverse);
    } else if (typeof items === "object" && items.id) {
      blockIds.push(items.id);

      if (items.children) {
        traverse(items.children);
      }
    } else if (typeof items === "object") {
      Object.values(items).forEach(traverse);
    }
  }

  traverse(content);
  return blockIds;
}

export function isBlockChildOf(
  blockId: string,
  parentBlockId: string,
  content: CustomBlock[],
): boolean {
  function searchInBlocks(
    blocks: any[],
    targetBlockId: string,
    currentParentId?: string,
  ): boolean {
    if (!Array.isArray(blocks)) return false;

    for (const block of blocks) {
      if (block.id === targetBlockId) {
        return currentParentId === parentBlockId;
      }

      if (block.children && Array.isArray(block.children)) {
        if (searchInBlocks(block.children, targetBlockId, block.id)) {
          return true;
        }
      }
    }

    return false;
  }

  return searchInBlocks(content, blockId);
}

export function filterOutChildBlocks(
  blocks: any[],
  content: CustomBlock[],
): any[] {
  const blockIds = blocks.map((b) => b.blockId);

  const filtered = blocks.filter((block) => {
    const isChild = blockIds.some(
      (otherBlockId) =>
        otherBlockId !== block.blockId &&
        isBlockChildOf(block.blockId, otherBlockId, content),
    );

    return !isChild;
  });

  return filtered;
}
