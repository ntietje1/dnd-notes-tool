import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { Id } from "../_generated/dataModel";
import {
  validateTagBelongsToCampaign,
  findTaggedBlock,
  addTagToTaggedBlock,
  removeTagFromTaggedBlock,
  findBlockById,
  extractTagIdsFromBlock,
  extractAllTagIdsFromContent,
} from "../tags/helpers";
import { getBaseUserId, verifyUserIdentity } from "../auth/helpers";

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    content: v.optional(v.any()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);

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

      const blockTagMap = extractAllTagIdsFromContent(args.content);

      const existingTaggedBlocks = await ctx.db
        .query("taggedBlocks")
        .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
        .collect();

      const existingBlockLevelTags = new Map<string, Id<"tags">[]>();

      for (const taggedBlock of existingTaggedBlocks) {
        const inlineTagIds = blockTagMap.get(taggedBlock.blockId) || [];

        if (inlineTagIds.length === 0) {
          existingBlockLevelTags.set(taggedBlock.blockId, taggedBlock.tagIds);
        }
      }

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
    await verifyUserIdentity(ctx);
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
    await verifyUserIdentity(ctx);
    await ctx.db.patch(args.folderId, { parentFolderId: args.parentId });
    return args.folderId;
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);
    await ctx.db.delete(args.noteId);
    return args.noteId;
  },
});

export const deleteFolder = mutation({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);

    const userId = getBaseUserId(identity.subject);

    const recursiveDelete = async (folderId: Id<"folders">) => {
      const childFolders = await ctx.db
        .query("folders")
        .withIndex("by_folder", (q) => q.eq("parentFolderId", folderId))
        .collect();

      const notesInFolder = await ctx.db
        .query("notes")
        .withIndex("by_folder", (q) => q.eq("parentFolderId", folderId))
        .collect();

      for (const childFolder of childFolders) {
        if (childFolder.userId === userId) {
          await recursiveDelete(childFolder._id);
        }
      }

      for (const note of notesInFolder) {
        if (note.userId === userId) {
          await ctx.db.delete(note._id);
        }
      }

      await ctx.db.delete(folderId);
    };

    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found or unauthorized");
    }

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
    await verifyUserIdentity(ctx);
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
    const identity = await verifyUserIdentity(ctx);

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
    const identity = await verifyUserIdentity(ctx);

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

export const addTagToBlock = mutation({
  args: {
    noteId: v.id("notes"),
    blockId: v.string(),
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== getBaseUserId(identity.subject)) {
      throw new Error("Note not found or unauthorized");
    }

    await validateTagBelongsToCampaign(ctx, args.tagId, note.campaignId);

    const existingTaggedBlock = await findTaggedBlock(
      ctx,
      args.noteId,
      args.blockId,
    );

    if (existingTaggedBlock) {
      await addTagToTaggedBlock(
        ctx,
        existingTaggedBlock._id,
        existingTaggedBlock.tagIds,
        args.tagId,
      );
    } else {
      await ctx.db.insert("taggedBlocks", {
        campaignId: note.campaignId,
        noteId: args.noteId,
        blockId: args.blockId,
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
    const identity = await verifyUserIdentity(ctx);

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== getBaseUserId(identity.subject)) {
      throw new Error("Note not found or unauthorized");
    }

    const taggedBlock = await findTaggedBlock(ctx, args.noteId, args.blockId);

    if (taggedBlock) {
      const blockContent = note.content;
      const inlineTagIds = extractTagIdsFromBlock(
        findBlockById(blockContent, args.blockId),
      );

      if (inlineTagIds.includes(args.tagId)) {
        return args.blockId;
      }

      await removeTagFromTaggedBlock(
        ctx,
        taggedBlock._id,
        taggedBlock.tagIds,
        args.tagId,
      );
    }

    return args.blockId;
  },
});
