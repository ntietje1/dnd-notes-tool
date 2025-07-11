import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkForSharedContent } from "./sharedContent";
import { Doc } from "./_generated/dataModel";
import { SaveNoteArgs, Note, Folder, SidebarData, FolderNode } from "./types";
import { Id } from "./_generated/dataModel";

// Helper function to get base user ID from OAuth subject
const getBaseUserId = (subject: string) => subject.split("|")[0];

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    content: v.optional(v.any()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args: SaveNoteArgs) => {
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
      const hasSharedContent = checkForSharedContent(args.content);
      updates.content = args.content;
      updates.hasSharedContent = hasSharedContent;
    }

    if (args.title !== undefined) {
      updates.title = args.title;
    }

    await ctx.db.patch(args.noteId, updates);
    return args.noteId;
  },
});

export const moveNote = mutation({
  args: {
    noteId: v.id("notes"),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(args.noteId, { folderId: args.folderId });
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
    await ctx.db.patch(args.folderId, { folderId: args.parentId });
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
    // await ctx.db.delete(args.folderId);
    // return args.folderId;
    //TODO: recursively delete

    const userId = getBaseUserId(identity.subject);

    // Helper function to recursively delete a folder and its contents
    const recursiveDelete = async (folderId: Id<"folders">) => {
      // Get all child folders
      const childFolders = await ctx.db
        .query("folders")
        .withIndex("by_folder", (q) => q.eq("folderId", folderId))
        .collect();

      // Get all notes in this folder
      const notesInFolder = await ctx.db
        .query("notes")
        .withIndex("by_folder", (q) => q.eq("folderId", folderId))
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

export const getNote = query({
  args: {
    noteId: v.optional(v.id("notes")),
  },
  handler: async (ctx, args): Promise<Note | null> => {
    if (!args.noteId) {
      return null;
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== getBaseUserId(identity.subject)) {
      return null;
    }

    return note as Note;
  },
});

export const getUserNotes = query({
  handler: async (ctx): Promise<Note[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .collect();

    return notes as Note[];
  },
});

export const getUserFolders = query({
  handler: async (ctx): Promise<Folder[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .collect();

    return folders as Folder[];
  },
});

export const getSidebarData = query({
  handler: async (ctx): Promise<SidebarData> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    const [folders, notes] = await Promise.all([
      ctx.db
        .query("folders")
        .withIndex("by_user", (q) => q.eq("userId", baseUserId))
        .collect(),
      ctx.db
        .query("notes")
        .withIndex("by_user", (q) => q.eq("userId", baseUserId))
        .collect(),
    ]);

    return {
      folders: folders as Folder[],
      notes: notes as Note[],
    };
  },
});

export const getFolderTree = query({
  handler: async (ctx): Promise<FolderNode[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    // Get all folders and notes for the user
    const [folders, notes] = (await Promise.all([
      ctx.db
        .query("folders")
        .withIndex("by_user", (q) => q.eq("userId", baseUserId))
        .collect(),
      ctx.db
        .query("notes")
        .withIndex("by_user", (q) => q.eq("userId", baseUserId))
        .collect(),
    ])) as [Folder[], Note[]];

    // Create a map of folder ID to its children
    const folderMap = new Map<Id<"folders">, FolderNode>();

    // Initialize the map with empty children arrays
    folders.forEach((folder) => {
      folderMap.set(folder._id, {
        ...folder,
        childFolders: [],
        childNotes: [],
      });
    });

    // Build the folder tree
    folders.forEach((folder) => {
      const node = folderMap.get(folder._id);
      if (node && folder.folderId) {
        const parentNode = folderMap.get(folder.folderId);
        if (parentNode) {
          parentNode.childFolders.push(node);
        }
      }
    });

    // Add notes to their parent folders
    notes.forEach((note) => {
      if (note.folderId) {
        const parentNode = folderMap.get(note.folderId);
        if (parentNode) {
          parentNode.childNotes.push(note);
        }
      }
    });

    // Return only root folders (those without a parent)
    return Array.from(folderMap.values()).filter((folder) => !folder.folderId);
  },
});

export const createFolder = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("folders", {
      userId: getBaseUserId(identity.subject),
      name: args.name || "",
      updatedAt: Date.now(),
    });
  },
});

export const createNote = mutation({
  args: {
    title: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("notes", {
      userId: getBaseUserId(identity.subject),
      title: args.title || "",
      content: { type: "doc", content: [{ type: "paragraph", content: [] }] },
      folderId: args.folderId,
      hasSharedContent: false,
      updatedAt: Date.now(),
    });
  },
});

export const getCurrentEditor = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = getBaseUserId(identity.subject);
    const editor = await ctx.db
      .query("editor")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return editor || undefined;
  },
});

export const setCurrentEditor = mutation({
  args: {
    noteId: v.optional(v.id("notes")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = getBaseUserId(identity.subject);

    // Find existing editor state for this user
    const existingEditor = await ctx.db
      .query("editor")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingEditor) {
      // Update existing editor state
      await ctx.db.patch(existingEditor._id, {
        noteId: args.noteId,
      });
      return existingEditor._id;
    } else {
      // Create new editor state
      const newEditorId = await ctx.db.insert("editor", {
        userId,
        noteId: args.noteId,
      });
      return newEditorId;
    }
  },
});
