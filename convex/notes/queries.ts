import { query } from "../_generated/server";
import { v } from "convex/values";
import { Note, FolderNode, AnySidebarItem, BlockWithTags } from "./types";
import { Id } from "../_generated/dataModel";
import { getBaseUserId } from "../auth";

export const getNote = query({
  args: {
    noteId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Note | null> => {
    if (!args.noteId || !args.noteId.length) {
      return null;
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId as Id<"notes">).catch((e) => {
      console.error("Error getting note:", e);
      return null;
    });
    if (!note || note.userId !== getBaseUserId(identity.subject)) {
      return null;
    }
    return { ...note, type: "notes" } as Note;
  },
});

export const getSidebarData = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args): Promise<AnySidebarItem[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!args.campaignId) {
      return [];
    }

    // Get all folders and notes for the user
    const [folders, notes] = await Promise.all([
      ctx.db
        .query("folders")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
        .collect(),
      ctx.db
        .query("notes")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
        .collect(),
    ]);

    // Create a map of folder ID to its FolderNode
    const folderMap = new Map<Id<"folders">, FolderNode>();

    // Initialize the map with empty children arrays
    folders.forEach((folder) => {
      folderMap.set(folder._id, {
        ...folder,
        type: "folders" as const,
        children: [],
      });
    });

    // Build the folder tree
    folders.forEach((folder) => {
      if (folder.parentFolderId) {
        const parentNode = folderMap.get(folder.parentFolderId);
        const node = folderMap.get(folder._id);
        if (parentNode && node) {
          parentNode.children.push(node);
        }
      }
    });

    // Transform notes and add them to their parent folders or root list
    const typedNotes = notes.map((note) => ({
      ...note,
      type: "notes" as const,
    })) as Note[];

    // Add notes to their parent folders
    typedNotes.forEach((note) => {
      if (note.parentFolderId) {
        const parentNode = folderMap.get(note.parentFolderId);
        if (parentNode) {
          parentNode.children.push(note);
        }
      }
    });

    // Get root folders (those without a parent)
    const rootFolders = Array.from(folderMap.values()).filter(
      (folder) => !folder.parentFolderId,
    );

    // Get root notes (those without a parent folder)
    const rootNotes = typedNotes.filter((note) => !note.parentFolderId);

    // Combine root folders and notes
    return [...rootFolders, ...rootNotes] as AnySidebarItem[];
  },
});

export const getBlocksByTags = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
    tagIds: v.array(v.id("tags")),
    includeNoteLevel: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<BlockWithTags[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!args.campaignId || args.tagIds.length === 0) {
      return [];
    }

    // Get all tagged blocks in the campaign
    const taggedBlocks = await ctx.db
      .query("taggedBlocks")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
      .collect();

    // Filter blocks that contain ALL required tags
    const matchingBlocks = taggedBlocks.filter((block) =>
      args.tagIds.every((tagId) => block.tagIds.includes(tagId)),
    );

    // Get note information and block content
    const results: BlockWithTags[] = [];
    const noteIds = [...new Set(matchingBlocks.map((b) => b.noteId))];
    const notes = await Promise.all(noteIds.map((id) => ctx.db.get(id)));
    const notesMap = new Map(
      notes.filter(Boolean).map((note) => [note!._id, note!]),
    );

    for (const block of matchingBlocks) {
      const note = notesMap.get(block.noteId);
      if (!note) continue;

      // Find the actual block content
      const blockContent = findBlockInContent(note.content, block.blockId);
      if (!blockContent) continue;

      results.push({
        noteId: block.noteId,
        noteName: note.name,
        blockId: block.blockId,
        blockContent,
        tagIds: block.tagIds,
        updatedAt: block.updatedAt,
      });
    }

    return results.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getBlocksByTag = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
    tagId: v.optional(v.id("tags")),
  },
  handler: async (ctx, args): Promise<BlockWithTags[]> => {
    // Call getBlocksByTags directly with a single tag
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!args.campaignId || !args.tagId) {
      return [];
    }

    // Get all tagged blocks in the campaign that contain this tag
    const taggedBlocks = await ctx.db
      .query("taggedBlocks")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
      .collect();

    // Filter blocks that contain the specified tag
    const matchingBlocks = taggedBlocks.filter((block) =>
      block.tagIds.includes(args.tagId!),
    );

    // Get note information and block content
    const results: BlockWithTags[] = [];
    const noteIds = [...new Set(matchingBlocks.map((b) => b.noteId))];
    const notes = await Promise.all(noteIds.map((id) => ctx.db.get(id)));
    const notesMap = new Map(
      notes.filter(Boolean).map((note) => [note!._id, note!]),
    );

    for (const block of matchingBlocks) {
      const note = notesMap.get(block.noteId);
      if (!note) continue;

      // Find the actual block content
      const blockContent = findBlockInContent(note.content, block.blockId);
      if (!blockContent) continue;

      results.push({
        noteId: block.noteId,
        noteName: note.name,
        blockId: block.blockId,
        blockContent,
        tagIds: block.tagIds,
        updatedAt: block.updatedAt,
      });
    }

    return results.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getBlockTags = query({
  args: {
    noteId: v.id("notes"),
    blockId: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"tags">[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const taggedBlock = await ctx.db
      .query("taggedBlocks")
      .withIndex("by_block_unique", (q) =>
        q.eq("noteId", args.noteId).eq("blockId", args.blockId),
      )
      .first();

    return taggedBlock?.tagIds || [];
  },
});

// Helper functions
function findBlockInContent(content: any[], blockId: string): any | null {
  if (!Array.isArray(content)) return null;

  for (const block of content) {
    if (block.id === blockId) {
      return block;
    }
    if (block.content) {
      const found = findBlockInContent(block.content, blockId);
      if (found) return found;
    }
  }
  return null;
}

function extractAllBlocksFromContent(content: any[]): Map<string, any> {
  const blocks = new Map<string, any>();

  function traverse(items: any[]) {
    if (!Array.isArray(items)) return;

    items.forEach((item) => {
      if (item.id) {
        blocks.set(item.id, item);
      }
      if (item.content) {
        traverse(item.content);
      }
    });
  }

  traverse(content);
  return blocks;
}
