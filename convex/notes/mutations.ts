import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { Id } from "../_generated/dataModel";
import {
  validateTagBelongsToCampaign,
  findBlock,
  addTagToBlock,
  removeTagFromBlock,
  saveTopLevelBlocks,
  findBlockById,
  extractTagIdsFromBlockContent,
  updateTagAndContent,
} from "../tags/helpers";
import { getBaseUserId, verifyUserIdentity } from "../common/identity";

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
      await saveTopLevelBlocks(ctx, args.noteId, note.campaignId, args.content);
    }

    if (args.name !== undefined) {
      updates.name = args.name;

      if (note.tagId) {
        const tag = await ctx.db.get(note.tagId);
        if (tag) {
          await updateTagAndContent(ctx, note.tagId, note.campaignId, tag.name, tag.color, { name: args.name });
        }
      }
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

    const note = await ctx.db.get(args.noteId);
    if (!note) return args.noteId;

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign_note_toplevel_pos", (q) =>
        q.eq("campaignId", note.campaignId).eq("noteId", args.noteId),
      )
      .collect();

    for (const block of blocks) {
      const blockTags = await ctx.db
        .query("blockTags")
        .withIndex("by_campaign_block_tag", (q) =>
          q.eq("campaignId", note.campaignId).eq("blockId", block._id),
        )
        .collect();

      for (const blockTag of blockTags) {
        await ctx.db.delete(blockTag._id);
      }

      await ctx.db.delete(block._id);
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
    const identity = await verifyUserIdentity(ctx);

    const userId = getBaseUserId(identity.subject);

    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found");
    }

    const recursiveDelete = async (folderId: Id<"folders">) => {
      const childFolders = await ctx.db
        .query("folders")
        .withIndex("by_campaign_parent", (q) => q.eq("campaignId", folder.campaignId).eq("parentFolderId", folderId))
        .collect();

      const notesInFolder = await ctx.db
        .query("notes")
        .withIndex("by_campaign_parent", (q) => q.eq("campaignId", folder.campaignId).eq("parentFolderId", folderId))
        .collect();

      for (const childFolder of childFolders) {
        if (childFolder.userId === userId) {
          await recursiveDelete(childFolder._id);
        }
      }

      for (const note of notesInFolder) {
        if (note.userId === userId) {
          const blocks = await ctx.db
            .query("blocks")
            .withIndex("by_campaign_note_toplevel_pos", (q) =>
              q.eq("campaignId", note.campaignId).eq("noteId", note._id),
            )
            .collect();

          for (const block of blocks) {
            const blockTags = await ctx.db
              .query("blockTags")
              .withIndex("by_campaign_block_tag", (q) =>
                q.eq("campaignId", note.campaignId).eq("blockId", block._id),
              )
              .collect();

            for (const blockTag of blockTags) {
              await ctx.db.delete(blockTag._id);
            }

            await ctx.db.delete(block._id);
          }

          await ctx.db.delete(note._id);
        }
      }

      await ctx.db.delete(folderId);
    };

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
      parentFolderId: args.parentFolderId,
      updatedAt: Date.now(),
      campaignId: args.campaignId,
    });

    const initialBlockId = crypto.randomUUID();
    await ctx.db.insert("blocks", {
      noteId,
      blockId: initialBlockId,
      position: 0,
      content: {
        type: "paragraph",
        id: initialBlockId,
        content: [],
      },
      isTopLevel: true,
      campaignId: args.campaignId,
      updatedAt: Date.now(),
    });

    return noteId;
  },
});

export const addTagToBlockMutation = mutation({
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

    const existingBlock = await findBlock(ctx, args.noteId, args.blockId);

    if (existingBlock) {
      const inlineTagIds = extractTagIdsFromBlockContent(existingBlock.content);
      if (inlineTagIds.includes(args.tagId)) {
        throw new Error(
          "Cannot manually add tag that already exists as inline tag in block content",
        );
      }

      await addTagToBlock(ctx, existingBlock._id, args.tagId);
    } else {
      const topLevelBlocks = await ctx.db
        .query("blocks")
        .withIndex("by_campaign_note_toplevel_pos", (q) =>
          q
            .eq("campaignId", note.campaignId)
            .eq("noteId", args.noteId)
            .eq("isTopLevel", true),
        )
        .collect()
        .then((blocks) =>
          blocks.sort((a, b) => (a.position || 0) - (b.position || 0)),
        );

      const currentContent = topLevelBlocks.map((block) => block.content);

      const targetBlock = findBlockById(currentContent, args.blockId);

      if (targetBlock) {
        const inlineTagIds = extractTagIdsFromBlockContent(targetBlock);
        if (inlineTagIds.includes(args.tagId)) {
          throw new Error(
            "Cannot manually add tag that already exists as inline tag in block content",
          );
        }

        const newBlockDbId = await ctx.db.insert("blocks", {
          noteId: args.noteId,
          blockId: args.blockId,
          position: undefined,
          content: targetBlock,
          isTopLevel: false,
          campaignId: note.campaignId,
          updatedAt: Date.now(),
        });

        await ctx.db.insert("blockTags", {
          campaignId: note.campaignId,
          blockId: newBlockDbId,
          tagId: args.tagId,
          createdAt: Date.now(),
        });
      } else {
        console.log(`Block ${args.blockId} not found in note content`);
      }
    }

    return args.blockId;
  },
});

export const removeTagFromBlockMutation = mutation({
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

    const block = await findBlock(ctx, args.noteId, args.blockId);

    if (block) {
      const inlineTagIds = extractTagIdsFromBlockContent(block.content);
      if (inlineTagIds.includes(args.tagId)) {
        throw new Error(
          "Cannot manually remove tag that exists as inline tag in block content",
        );
      }

      await removeTagFromBlock(ctx, block._id, args.tagId, block.isTopLevel);
    }

    return args.blockId;
  },
});
