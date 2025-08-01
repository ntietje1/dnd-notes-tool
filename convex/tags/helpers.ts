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
    .withIndex("by_block_unique", (q) =>
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
  // Check if the relationship already exists
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

    // Update block timestamp
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
  // Remove the tag relationship
  const blockTag = await ctx.db
    .query("blockTags")
    .withIndex("by_block_tag", (q) =>
      q.eq("blockId", blockDbId).eq("tagId", tagIdToRemove),
    )
    .first();

  if (blockTag) {
    await ctx.db.delete(blockTag._id);
  }

  // Check if block has any remaining tags
  const remainingTags = await getBlockTags(ctx, blockDbId);

  // If no more tags and it's not a top-level block, delete it
  if (remainingTags.length === 0 && !isTopLevel) {
    await ctx.db.delete(blockDbId);
    return null;
  } else {
    // Update block timestamp
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
  const blocks = await ctx.db
    .query("blocks")
    .withIndex("by_note", (q) => q.eq("noteId", noteId))
    .filter((q) => q.eq(q.field("isTopLevel"), true))
    .collect();

  // Sort by position
  return blocks.sort((a, b) => (a.position || 0) - (b.position || 0));
}

// New function to extract all blocks (including nested ones) with their tags
// Only returns blocks that are top-level OR have tags (for efficient storage)
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
        // Extract tags from this specific block's immediate content (not nested content)
        const tagIds = extractTagIdsFromBlockContent(block);

        // Only store blocks that are top-level OR have tags
        if (isTopLevel || tagIds.length > 0) {
          blocksMap.set(block.id, {
            block: block,
            tagIds: tagIds,
            isTopLevel: isTopLevel,
          });
        }
      }

      // Recursively traverse nested blocks in children property (BlockNote structure)
      if (block.children && Array.isArray(block.children)) {
        traverseBlocks(block.children, false);
      }

      // Also check content property in case there are nested blocks there
      if (block.content && Array.isArray(block.content)) {
        // Filter out non-block content (text, inline elements)
        const nestedBlocks = block.content.filter(
          (item: any) => item && typeof item === "object" && item.id,
        );
        if (nestedBlocks.length > 0) {
          traverseBlocks(nestedBlocks, false);
        }
      }
    });
  }

  traverseBlocks(content, true);
  return blocksMap;
}

// Modified function to extract tags only from immediate block content, not nested blocks
export function extractTagIdsFromBlockContent(block: any): Id<"tags">[] {
  const tagIds: Id<"tags">[] = [];

  function traverseImmediate(content: any, depth: number = 0) {
    if (!content || depth > 2) return; // Limit depth to avoid going into nested blocks

    if (Array.isArray(content)) {
      content.forEach((item) => traverseImmediate(item, depth + 1));
    } else if (typeof content === "object") {
      // Check for tag type specifically
      if (
        content.type === "tag" &&
        content.props?.tagId &&
        !tagIds.includes(content.props.tagId)
      ) {
        tagIds.push(content.props.tagId);
        return; // Don't traverse deeper into tag objects
      }

      // Only traverse specific properties to avoid nested blocks
      if (content.text !== undefined || content.type === "text") {
        // This is text content, continue traversing
        Object.values(content).forEach((value) =>
          traverseImmediate(value, depth + 1),
        );
      } else if (content.content && !content.id) {
        // This has content but no id, so it's not a nested block
        traverseImmediate(content.content, depth + 1);
      }
    }
  }

  // Only traverse the immediate content, not nested blocks
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

  // Extract all blocks (including nested ones) with their tags
  const allBlocksWithTags = extractAllBlocksWithTags(content);

  // Get all existing blocks for this note
  const existingBlocks = await ctx.db
    .query("blocks")
    .withIndex("by_note", (q) => q.eq("noteId", noteId))
    .collect();

  const existingBlocksMap = new Map(
    existingBlocks.map((block) => [block.blockId, block]),
  );

  // Track which blocks we've processed
  const processedBlockIds = new Set<string>();

  // Process each block found in content
  for (const [
    blockId,
    { block, tagIds: inlineTagIds, isTopLevel },
  ] of allBlocksWithTags) {
    processedBlockIds.add(blockId);
    const existingBlock = existingBlocksMap.get(blockId);

    let finalBlockDbId: Id<"blocks">;

    if (existingBlock) {
      // Update existing block
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
      // Create new block
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

    // Handle tags for this block
    if (existingBlock) {
      // Get current tags from junction table
      const currentTagIds = await getBlockTags(ctx, finalBlockDbId);

      // Get old inline tags from previous content
      const oldInlineTagIds = existingBlock.content
        ? extractTagIdsFromBlockContent(existingBlock.content)
        : [];

      // Find manual tags (tags that were added via side menu, not inline)
      const manualTags = currentTagIds.filter(
        (tagId) => !oldInlineTagIds.includes(tagId),
      );

      // Determine final tag IDs (current inline tags + preserved manual tags)
      const finalTagIds = [...new Set([...inlineTagIds, ...manualTags])];

      // Update tags: remove old ones and add new ones
      const tagsToRemove = currentTagIds.filter(
        (tagId) => !finalTagIds.includes(tagId),
      );
      const tagsToAdd = finalTagIds.filter(
        (tagId) => !currentTagIds.includes(tagId),
      );

      // Remove old tags
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

      // Add new tags
      for (const tagId of tagsToAdd) {
        await ctx.db.insert("blockTags", {
          blockId: finalBlockDbId,
          tagId: tagId,
          createdAt: now,
        });
      }
    } else {
      // For new blocks, just add all inline tags
      for (const tagId of inlineTagIds) {
        await ctx.db.insert("blockTags", {
          blockId: finalBlockDbId,
          tagId: tagId,
          createdAt: now,
        });
      }
    }
  }

  // Handle existing blocks that are no longer in the content
  for (const existingBlock of existingBlocks) {
    if (!processedBlockIds.has(existingBlock.blockId)) {
      // Block was removed from content
      const currentTagIds = await getBlockTags(ctx, existingBlock._id);

      if (currentTagIds.length === 0) {
        // No tags, safe to delete
        await ctx.db.delete(existingBlock._id);
      } else {
        // This block has tags but is no longer in the content
        // Keep it but mark as non-top-level
        await ctx.db.patch(existingBlock._id, {
          isTopLevel: false,
          position: undefined,
          updatedAt: now,
        });
      }
    }
  }
}

// Keep the old function for backward compatibility but mark it deprecated
export function extractTagIdsFromBlock(block: CustomBlock): Id<"tags">[] {
  return extractTagIdsFromBlockContent(block);
}

export function findBlockById(content: any, blockId: string): any | null {
  if (!Array.isArray(content)) return null;

  for (const block of content) {
    if (block.id === blockId) {
      return block;
    }

    // Search in children property (BlockNote structure)
    if (block.children && Array.isArray(block.children)) {
      const found = findBlockById(block.children, blockId);
      if (found) return found;
    }

    // Search in content property for nested blocks
    if (block.content && Array.isArray(block.content)) {
      const found = findBlockById(block.content, blockId);
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

      // Traverse children property (BlockNote structure)
      if (items.children) {
        traverse(items.children);
      }

      // Traverse content property
      if (items.content) {
        traverse(items.content);
      }
    } else if (typeof items === "object") {
      Object.values(items).forEach(traverse);
    }
  }

  traverse(content);
  return blockIds;
}

// Helper function to check if blockId is a child of parentBlockId
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

      // Search in children
      if (block.children && Array.isArray(block.children)) {
        if (searchInBlocks(block.children, targetBlockId, block.id)) {
          return true;
        }
      }

      // Search in content
      if (block.content && Array.isArray(block.content)) {
        const nestedBlocks = block.content.filter(
          (item: any) => item && typeof item === "object" && item.id,
        );
        if (searchInBlocks(nestedBlocks, targetBlockId, block.id)) {
          return true;
        }
      }
    }

    return false;
  }

  return searchInBlocks(content, blockId);
}

// Filter out child blocks when their parent blocks are already in the result set
export function filterOutChildBlocks(
  blocks: any[],
  content: CustomBlock[],
): any[] {
  const blockIds = blocks.map((b) => b.blockId);

  const filtered = blocks.filter((block) => {
    // Check if this block is a child of any other block in the result set
    const isChild = blockIds.some(
      (otherBlockId) =>
        otherBlockId !== block.blockId &&
        isBlockChildOf(block.blockId, otherBlockId, content),
    );

    return !isChild;
  });

  return filtered;
}
