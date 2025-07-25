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

      // Extract and update block-tag relationships
      const blockTagMap = extractAllTagIdsFromContent(args.content);

      // Remove existing tagged blocks for this note
      const existingTaggedBlocks = await ctx.db
        .query("taggedBlocks")
        .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
        .collect();

      for (const taggedBlock of existingTaggedBlocks) {
        await ctx.db.delete(taggedBlock._id);
      }

      for (const [blockId, tagIds] of blockTagMap.entries()) {
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
