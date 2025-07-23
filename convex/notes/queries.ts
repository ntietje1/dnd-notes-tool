import { query } from "../_generated/server";
import { v } from "convex/values";
import { Note, FolderNode, AnySidebarItem } from "./types";
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

    try {
      const note = await ctx.db.get(args.noteId as Id<"notes">);
      if (!note || note.userId !== getBaseUserId(identity.subject)) {
        return null;
      }
      return { ...note, type: "notes" } as Note;
    } catch (e) {
      return null;
    }
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
