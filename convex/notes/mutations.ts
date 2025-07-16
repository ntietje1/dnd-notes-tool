import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { checkForSharedContent } from "../sharedContent";
import { Doc } from "../_generated/dataModel";
import { Id } from "../_generated/dataModel";
import { api } from "../_generated/api";

// Helper function to get base user ID from OAuth subject
const getBaseUserId = (subject: string) => subject.split("|")[0];

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    content: v.optional(v.any()),
    name: v.optional(v.string()),
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
      const hasSharedContent = checkForSharedContent(args.content);
      updates.content = args.content;
      updates.hasSharedContent = hasSharedContent;
    }

    if (args.name !== undefined) {
      updates.name = args.name;
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
    name: v.optional(v.string()),
    parentFolderId: v.optional(v.id("folders")),
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
      hasSharedContent: false,
      updatedAt: Date.now(),
    });

    await ctx.runMutation(api.notes.mutations.setCurrentEditor, { noteId });
    return noteId;
  },
});

export const setCurrentEditor = mutation({
  args: {
    noteId: v.optional(v.id("notes")),
    sortOrder: v.optional(
      v.union(
        v.literal("alphabetical"),
        v.literal("dateCreated"),
        v.literal("dateModified"),
      ),
    ),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    const editor = await ctx.db
      .query("editor")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .first();

    if (!editor) {
      return ctx.db.insert("editor", {
        userId: baseUserId,
        activeNoteId: args.noteId,
        sortOrder: args.sortOrder ?? "alphabetical",
        sortDirection: args.sortDirection ?? "asc",
      });
    }

    return ctx.db.patch(editor._id, {
      ...(args.noteId !== undefined && { activeNoteId: args.noteId }),
      ...(args.sortOrder !== undefined && { sortOrder: args.sortOrder }),
      ...(args.sortDirection !== undefined && {
        sortDirection: args.sortDirection,
      }),
    });
  },
});
