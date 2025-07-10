import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkForSharedContent } from "./sharedContent";
import { Doc } from "./_generated/dataModel";
import { SaveNoteArgs, Note, Folder, SidebarData } from "./types";

// Helper function to get base user ID from OAuth subject
const getBaseUserId = (subject: string) => subject.split("|")[0];

export const saveNote = mutation({
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

    // Update the specific note
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

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity(); //TODO: check if the note belongs to the user
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
    const identity = await ctx.auth.getUserIdentity(); //TODO: check if the folder belongs to the user
    if (!identity) {
      throw new Error("Not authenticated");
    }
    await ctx.db.delete(args.folderId);
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
      throw new Error("Note not found or unauthorized");
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
