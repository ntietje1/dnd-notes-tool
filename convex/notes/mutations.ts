import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { Id } from "../_generated/dataModel";
import { getBaseUserId } from "../auth";

// Helper function to extract tag IDs from block content
function extractTagIdsFromBlock(block: any): Id<"tags">[] {
  if (!block) return [];

  const tagIds: Id<"tags">[] = [];

  function traverseContent(content: any) {
    if (!content) return;

    if (Array.isArray(content)) {
      content.forEach(traverseContent);
    } else if (typeof content === "object") {
      // Check if this is a tag inline content
      if (content.type === "tag" && content.props?.tagId) {
        tagIds.push(content.props.tagId);
      }

      // Recursively check content and attrs
      if (content.content) traverseContent(content.content);
      if (content.attrs) traverseContent(content.attrs);
    }
  }

  traverseContent(block);
  return [...new Set(tagIds)]; // Remove duplicates
}

// Helper function to find a block by ID in note content
function findBlockById(content: any[], blockId: string): any {
  if (!Array.isArray(content)) return null;

  for (const block of content) {
    if (block.id === blockId) {
      return block;
    }

    // Recursively search nested content
    if (block.content && Array.isArray(block.content)) {
      const found = findBlockById(block.content, blockId);
      if (found) return found;
    }
  }

  return null;
}

// Helper function to extract all tag IDs from note content
function extractAllTagIdsFromContent(
  content: any[],
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

      // Recursively check nested content
      if (block.content) {
        traverseBlocks(block.content);
      }
    });
  }

  traverseBlocks(content);
  return blockTagMap;
}

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    content: v.optional(v.any()),
    name: v.optional(v.string()),
    tagIds: v.optional(v.array(v.id("tags"))), // Note-level tags
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== getBaseUserId(identity.subject)) {
      throw new Error("Note not found or unauthorized");
    }

    const now = Date.now();
    const updates: Partial<Doc<"notes">> = {
      updatedAt: now,
    };

    if (args.content !== undefined) {
      updates.content = args.content;

      // Extract inline tags from block content
      const blockTagMap = extractAllTagIdsFromContent(args.content);

      // Get existing tagged blocks for this note
      const existingTaggedBlocks = await ctx.db
        .query("taggedBlocks")
        .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
        .collect();

      // Create a map of existing block-level tags (not from inline content)
      const existingBlockLevelTags = new Map<string, Id<"tags">[]>();

      for (const taggedBlock of existingTaggedBlocks) {
        // Check if this block has inline tags in the new content
        const inlineTagIds = blockTagMap.get(taggedBlock.blockId) || [];

        // If there are no inline tags for this block, preserve the block-level tags
        if (inlineTagIds.length === 0) {
          existingBlockLevelTags.set(taggedBlock.blockId, taggedBlock.tagIds);
        }
      }

      // Remove all existing tagged blocks for this note
      for (const taggedBlock of existingTaggedBlocks) {
        await ctx.db.delete(taggedBlock._id);
      }

      // Recreate tagged blocks from inline content
      for (const [blockId, tagIds] of blockTagMap.entries()) {
        await ctx.db.insert("taggedBlocks", {
          noteId: args.noteId,
          blockId,
          campaignId: note.campaignId,
          tagIds,
          updatedAt: now,
        });
      }

      // Restore block-level tags for blocks that don't have inline tags
      for (const [blockId, tagIds] of existingBlockLevelTags.entries()) {
        await ctx.db.insert("taggedBlocks", {
          noteId: args.noteId,
          blockId,
          campaignId: note.campaignId,
          tagIds,
          updatedAt: now,
        });
      }
    }

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.tagIds !== undefined) {
      updates.tagIds = args.tagIds;
    }

    await ctx.db.patch(args.noteId, updates);
    return args.noteId;
  },
});

export const moveNote = mutation({
  args: {
    noteId: v.id("notes"),
    parentFolderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(args.noteId, { parentFolderId: args.parentFolderId });
    return args.noteId;
  },
});

export const moveFolder = mutation({
  args: {
    folderId: v.id("folders"),
    parentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(args.folderId, { parentFolderId: args.parentId });
    return args.folderId;
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await ctx.db.delete(args.noteId);
    return args.noteId;
  },
});

export const deleteFolder = mutation({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = getBaseUserId(identity.subject);

    // Helper function to recursively delete a folder and its contents
    const recursiveDelete = async (folderId: Id<"folders">) => {
      // Get all child folders
      const childFolders = await ctx.db
        .query("folders")
        .withIndex("by_folder", (q) => q.eq("parentFolderId", folderId))
        .collect();

      // Get all notes in this folder
      const notesInFolder = await ctx.db
        .query("notes")
        .withIndex("by_folder", (q) => q.eq("parentFolderId", folderId))
        .collect();

      // Recursively delete child folders
      for (const childFolder of childFolders) {
        if (childFolder.userId === userId) {
          await recursiveDelete(childFolder._id);
        }
      }

      // Delete all notes in this folder
      for (const note of notesInFolder) {
        if (note.userId === userId) {
          await ctx.db.delete(note._id);
        }
      }

      // Delete the folder itself
      await ctx.db.delete(folderId);
    };

    // Get the folder to verify ownership
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found or unauthorized");
    }

    // Start the recursive deletion
    await recursiveDelete(args.folderId);
    return args.folderId;
  },
});

export const updateFolder = mutation({
  args: {
    folderId: v.id("folders"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(args.folderId, { name: args.name });
    return args.folderId;
  },
});

export const createFolder = mutation({
  args: {
    name: v.optional(v.string()),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("folders", {
      userId: getBaseUserId(identity.subject),
      name: args.name || "",
      campaignId: args.campaignId,
      updatedAt: Date.now(),
    });
  },
});

export const createNote = mutation({
  args: {
    name: v.optional(v.string()),
    parentFolderId: v.optional(v.id("folders")),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const noteId = await ctx.db.insert("notes", {
      userId: getBaseUserId(identity.subject),
      name: args.name || "",
      content: { type: "doc", content: [{ type: "paragraph", content: [] }] },
      parentFolderId: args.parentFolderId,
      updatedAt: Date.now(),
      campaignId: args.campaignId,
    });

    return noteId;
  },
});

// Function to check if content has shared blocks
function checkForSharedContent(content: any): boolean {
  if (!content) return false;

  // Check if the current node is shared
  if (content.attrs?.shared === true) {
    return true;
  }

  // Recursively check content array
  if (Array.isArray(content.content)) {
    return content.content.some(checkForSharedContent);
  }

  return false;
}

export const addTagToBlock = mutation({
  args: {
    noteId: v.id("notes"),
    blockId: v.string(),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== getBaseUserId(identity.subject)) {
      throw new Error("Note not found or unauthorized");
    }

    // Check if the tag exists and belongs to the same campaign
    const tag = await ctx.db.get(args.tagId);
    if (!tag || tag.campaignId !== note.campaignId) {
      throw new Error("Tag not found or unauthorized");
    }

    // Check if there's already a tagged block entry for this block
    const existingTaggedBlock = await ctx.db
      .query("taggedBlocks")
      .withIndex("by_block_unique", (q) =>
        q.eq("noteId", args.noteId).eq("blockId", args.blockId),
      )
      .first();

    if (existingTaggedBlock) {
      // Add the tag to existing entry if it's not already there
      if (!existingTaggedBlock.tagIds.includes(args.tagId)) {
        await ctx.db.patch(existingTaggedBlock._id, {
          tagIds: [...existingTaggedBlock.tagIds, args.tagId],
          updatedAt: Date.now(),
        });
      }
    } else {
      // Create new tagged block entry
      await ctx.db.insert("taggedBlocks", {
        noteId: args.noteId,
        blockId: args.blockId,
        campaignId: note.campaignId,
        tagIds: [args.tagId],
        updatedAt: Date.now(),
      });
    }

    return args.blockId;
  },
});

export const removeTagFromBlock = mutation({
  args: {
    noteId: v.id("notes"),
    blockId: v.string(),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== getBaseUserId(identity.subject)) {
      throw new Error("Note not found or unauthorized");
    }

    // Find the tagged block entry
    const taggedBlock = await ctx.db
      .query("taggedBlocks")
      .withIndex("by_block_unique", (q) =>
        q.eq("noteId", args.noteId).eq("blockId", args.blockId),
      )
      .first();

    if (taggedBlock) {
      // Check if the tag still exists as an inline tag in the block content
      const blockContent = note.content;
      const inlineTagIds = extractTagIdsFromBlock(
        findBlockById(blockContent, args.blockId),
      );

      // If the tag exists as an inline tag, don't remove it from taggedBlocks
      if (inlineTagIds.includes(args.tagId)) {
        return args.blockId;
      }

      const updatedTagIds = taggedBlock.tagIds.filter(
        (id) => id !== args.tagId,
      );

      if (updatedTagIds.length === 0) {
        // Remove the entire entry if no tags remain
        await ctx.db.delete(taggedBlock._id);
      } else {
        // Update with remaining tags
        await ctx.db.patch(taggedBlock._id, {
          tagIds: updatedTagIds,
          updatedAt: Date.now(),
        });
      }
    }

    return args.blockId;
  },
});
