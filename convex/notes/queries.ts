import { query } from "../_generated/server";
import { v } from "convex/values";
import { Note, FolderNode, AnySidebarItem, BlockWithTags } from "./types";
import { Id } from "../_generated/dataModel";
import { findTaggedBlock, findBlockById } from "../tags/helpers";
import { getBaseUserId, verifyUserIdentity } from "../model/helpers";
import { CustomBlock } from "../../app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";

export const getNote = query({
  args: {
    noteId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Note | null> => {
    if (!args.noteId || !args.noteId.length) {
      return null;
    }

    const identity = await verifyUserIdentity(ctx);

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
    await verifyUserIdentity(ctx);

    if (!args.campaignId) {
      return [];
    }

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

    const folderMap = new Map<Id<"folders">, FolderNode>();

    folders.forEach((folder) => {
      folderMap.set(folder._id, {
        ...folder,
        type: "folders" as const,
        children: [],
      });
    });

    folders.forEach((folder) => {
      if (folder.parentFolderId) {
        const parentNode = folderMap.get(folder.parentFolderId);
        const node = folderMap.get(folder._id);
        if (parentNode && node) {
          parentNode.children.push(node);
        }
      }
    });

    const typedNotes = notes.map((note) => ({
      ...note,
      type: "notes" as const,
    })) as Note[];

    typedNotes.forEach((note) => {
      if (note.parentFolderId) {
        const parentNode = folderMap.get(note.parentFolderId);
        if (parentNode) {
          parentNode.children.push(note);
        }
      }
    });

    const rootFolders = Array.from(folderMap.values()).filter(
      (folder) => !folder.parentFolderId,
    );

    const rootNotes = typedNotes.filter((note) => !note.parentFolderId);

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
    await verifyUserIdentity(ctx);

    if (!args.campaignId || args.tagIds.length === 0) {
      return [];
    }

    const taggedBlocks = await ctx.db
      .query("taggedBlocks")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
      .collect();

    const matchingBlocks = taggedBlocks.filter((block) =>
      args.tagIds.every((tagId) => block.tagIds.includes(tagId)),
    );

    const results: BlockWithTags[] = [];
    const noteIds = [...new Set(matchingBlocks.map((b) => b.noteId))];
    const notes = await Promise.all(noteIds.map((id) => ctx.db.get(id)));
    const notesMap = new Map(
      notes.filter(Boolean).map((note) => [note!._id, note!]),
    );

    for (const block of matchingBlocks) {
      const note = notesMap.get(block.noteId);
      if (!note) continue;

      const blockContent = findBlockById(note.content, block.blockId);
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
    await verifyUserIdentity(ctx);

    if (!args.campaignId || !args.tagId) {
      return [];
    }

    const taggedBlocks = await ctx.db
      .query("taggedBlocks")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
      .collect();

    const matchingBlocks = taggedBlocks.filter((block) =>
      block.tagIds.includes(args.tagId!),
    );

    const results: BlockWithTags[] = [];
    const noteIds = [...new Set(matchingBlocks.map((b) => b.noteId))];
    const notes = await Promise.all(noteIds.map((id) => ctx.db.get(id)));
    const notesMap = new Map(
      notes.filter(Boolean).map((note) => [note!._id, note!]),
    );

    for (const block of matchingBlocks) {
      const note = notesMap.get(block.noteId);
      if (!note) continue;

      const blockContent = findBlockById(note.content, block.blockId);
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
    await verifyUserIdentity(ctx);

    const taggedBlock = await findTaggedBlock(ctx, args.noteId, args.blockId);
    return taggedBlock?.tagIds || [];
  },
});
