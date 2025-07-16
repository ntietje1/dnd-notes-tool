import { query } from "../_generated/server";
import { v } from "convex/values";
import { Note, Folder, FolderNode, AnySidebarItem } from "./types";
import { Id } from "../_generated/dataModel";

// Helper function to get base user ID from OAuth subject
const getBaseUserId = (subject: string) => subject.split("|")[0];

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

    return { ...note, type: "notes" } as Note;
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

    return notes.map((note) => ({ ...note, type: "notes" })) as Note[];
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

    return folders.map((folder) => ({
      ...folder,
      type: "folders",
    })) as Folder[];
  },
});

export const getSidebarData = query({
  handler: async (ctx): Promise<AnySidebarItem[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    // Get all folders and notes for the user
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

export const getFolderTree = query({
  handler: async (ctx): Promise<FolderNode[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    // Get all folders and notes for the user
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

    // Transform notes to add type
    const typedNotes = notes.map((note) => ({
      ...note,
      type: "notes" as const,
    }));

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

    // Add notes to their parent folders
    typedNotes.forEach((note) => {
      if (note.parentFolderId) {
        const parentNode = folderMap.get(note.parentFolderId);
        if (parentNode) {
          parentNode.children.push(note);
        }
      }
    });

    // Return only root folders (those without a parent)
    return Array.from(folderMap.values()).filter(
      (folder) => !folder.parentFolderId,
    );
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

    return editor;
  },
});
