import { CustomBlock } from "../../app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";
import { Id } from "../_generated/dataModel";
import { DatabaseReader, DatabaseWriter } from "../_generated/server";
import { Tag } from "./types";

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

export async function findTaggedBlock(
  ctx: { db: DatabaseReader },
  noteId: Id<"notes">,
  blockId: string,
) {
  return await ctx.db
    .query("taggedBlocks")
    .withIndex("by_block_unique", (q) =>
      q.eq("noteId", noteId).eq("blockId", blockId),
    )
    .first();
}

export async function addTagToTaggedBlock(
  ctx: { db: DatabaseWriter },
  taggedBlockId: Id<"taggedBlocks">,
  existingTagIds: Id<"tags">[],
  newTagId: Id<"tags">,
) {
  if (!existingTagIds.includes(newTagId)) {
    await ctx.db.patch(taggedBlockId, {
      tagIds: [...existingTagIds, newTagId],
      updatedAt: Date.now(),
    });
  }
  return taggedBlockId;
}

export async function removeTagFromTaggedBlock(
  ctx: { db: DatabaseWriter },
  taggedBlockId: Id<"taggedBlocks">,
  existingTagIds: Id<"tags">[],
  tagIdToRemove: Id<"tags">,
) {
  const updatedTagIds = existingTagIds.filter((id) => id !== tagIdToRemove);

  if (updatedTagIds.length === 0) {
    await ctx.db.delete(taggedBlockId);
    return null;
  } else {
    await ctx.db.patch(taggedBlockId, {
      tagIds: updatedTagIds,
      updatedAt: Date.now(),
    });
    return taggedBlockId;
  }
}

export function findBlockById(content: any, blockId: string): any | null {
  if (!Array.isArray(content)) return null;

  for (const block of content) {
    if (block.id === blockId) {
      return block;
    }
    if (block.content) {
      const found = findBlockById(block.content, blockId);
      if (found) return found;
    }
  }
  return null;
}

export function extractTagIdsFromBlock(block: CustomBlock): Id<"tags">[] {
  const tagIds: Id<"tags">[] = [];

  function traverseContent(content: any) {
    if (!content) return;

    if (Array.isArray(content)) {
      content.forEach(traverseContent);
    } else if (typeof content === "object") {
      if (content.type === "tag" && content.props?.tagId) {
        tagIds.push(content.props.tagId);
      }

      Object.values(content).forEach(traverseContent);
    }
  }

  traverseContent(block);
  return tagIds;
}

export function extractAllTagIdsFromContent(
  content: CustomBlock[],
): Map<string, Id<"tags">[]> {
  const blockTagMap = new Map<string, Id<"tags">[]>();

  function traverseBlocks(blocks: any[]) {
    if (!Array.isArray(blocks)) return;

    blocks.forEach((block) => {
      if (block.id) {
        const tagIds = extractTagIdsFromBlock(block);
        if (tagIds.length > 0) {
          blockTagMap.set(block.id, tagIds);
        }
      }

      if (block.content) {
        traverseBlocks(block.content);
      }
    });
  }

  traverseBlocks(content);
  return blockTagMap;
}
