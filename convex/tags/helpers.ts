import { CustomBlock } from "../../app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";
import { Id } from "../_generated/dataModel";
import { DatabaseReader, DatabaseWriter } from "../_generated/server";
import { Tag } from "./types";
import { Block } from "../notes/types";

export async function validateTagBelongsToCampaign(
  ctx: { db: DatabaseReader },
  tagId: Id<"tags">,
  campaignId: Id<"campaigns">,
): Promise<Tag> {
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
  ctx: { db: DatabaseReader },
  noteId: Id<"notes">,
  blockId: string,
): Promise<Block | null> {
  return await ctx.db
    .query("blocks")
    .withIndex("by_note_block", (q) =>
      q.eq("noteId", noteId).eq("blockId", blockId),
    )
    .first();
}

export async function getBlockTags(
  ctx: { db: DatabaseReader },
  blockDbId: Id<"blocks">,
): Promise<Id<"tags">[]> {
  const blockTags = await ctx.db
    .query("blockTags")
    .withIndex("by_block", (q) => q.eq("blockId", blockDbId))
    .collect();

  return blockTags.map((bt) => bt.tagId);
}

export async function addTagToBlock(
  ctx: { db: DatabaseWriter },
  blockDbId: Id<"blocks">,
  tagId: Id<"tags">,
) {
  const existing = await ctx.db
    .query("blockTags")
    .withIndex("by_block_tag", (q) =>
      q.eq("blockId", blockDbId).eq("tagId", tagId),
    )
    .first();

  if (!existing) {
    await ctx.db.insert("blockTags", {
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
  ctx: { db: DatabaseWriter },
  blockDbId: Id<"blocks">,
  tagIdToRemove: Id<"tags">,
  isTopLevel: boolean,
) {
  const blockTag = await ctx.db
    .query("blockTags")
    .withIndex("by_block_tag", (q) =>
      q.eq("blockId", blockDbId).eq("tagId", tagIdToRemove),
    )
    .first();

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
  ctx: { db: DatabaseReader },
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

        if (isTopLevel || tagIds.length > 0) {
          blocksMap.set(block.id, {
            block: block,
            tagIds: tagIds,
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
  ctx: { db: DatabaseWriter },
  noteId: Id<"notes">,
  campaignId: Id<"campaigns">,
  content: CustomBlock[],
) {
  const now = Date.now();

  const allBlocksWithTags = extractAllBlocksWithTags(content);

  const note = await ctx.db.get(noteId);
  if (!note) return;

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

      const finalTagIds = [...new Set([...inlineTagIds, ...manualTags])];

      const tagsToRemove = currentTagIds.filter(
        (tagId) => !finalTagIds.includes(tagId),
      );
      const tagsToAdd = finalTagIds.filter(
        (tagId) => !currentTagIds.includes(tagId),
      );

      for (const tagId of tagsToRemove) {
        const blockTag = await ctx.db
          .query("blockTags")
          .withIndex("by_block_tag", (q) =>
            q.eq("blockId", finalBlockDbId).eq("tagId", tagId),
          )
          .first();
        if (blockTag) {
          await ctx.db.delete(blockTag._id);
        }
      }

      for (const tagId of tagsToAdd) {
        await ctx.db.insert("blockTags", {
          blockId: finalBlockDbId,
          tagId: tagId,
          createdAt: now,
        });
      }
    } else {
      for (const tagId of inlineTagIds) {
        await ctx.db.insert("blockTags", {
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
