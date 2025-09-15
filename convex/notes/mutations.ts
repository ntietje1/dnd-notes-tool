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
} from "../tags/tags";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { getFolder as getFolderFn } from "./notes";

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    content: v.optional(v.any()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"notes">> => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    await requireCampaignMembership(ctx, { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const now = Date.now();
    const updates: Partial<Doc<"notes">> = {
      updatedAt: now,
    };

    if (args.content !== undefined) {
      await saveTopLevelBlocks(ctx, args.noteId, note.campaignId, args.content);
    }

    if (args.name !== undefined) {
      updates.name = args.name;

      const tag = await ctx.db
        .query("tags")
        .withIndex("by_campaign_noteId", (q) =>
          q.eq("campaignId", note.campaignId).eq("noteId", args.noteId),
        )
        .unique();
      if (tag) {
        await updateTagAndContent(ctx, tag._id, { displayName: args.name, color: tag.color });
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
  handler: async (ctx, args): Promise<Id<"notes">> => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    await requireCampaignMembership(ctx, { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    await ctx.db.patch(args.noteId, { parentFolderId: args.parentFolderId });
    return args.noteId;
  },
});

export const moveFolder = mutation({
  args: {
    folderId: v.id("folders"),
    parentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args): Promise<Id<"folders">> => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    await requireCampaignMembership(ctx, { campaignId: folder.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );
    await ctx.db.patch(args.folderId, { parentFolderId: args.parentId });
    return args.folderId;
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args): Promise<Id<"notes">> => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    await requireCampaignMembership(ctx, { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

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
  handler: async (ctx, args): Promise<Id<"folders">> => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    await requireCampaignMembership(ctx, { campaignId: folder.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

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
        await recursiveDelete(childFolder._id);
      }

      for (const note of notesInFolder) {
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
  handler: async (ctx, args): Promise<Id<"folders">> => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }

    await requireCampaignMembership(ctx, { campaignId: folder.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );
    await ctx.db.patch(args.folderId, { name: args.name });
    return args.folderId;
  },
});

export const createFolder = mutation({
  args: {
    name: v.optional(v.string()),
    campaignId: v.optional(v.id("campaigns")),
    parentFolderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args): Promise<Id<"folders">> => {
    let campaignId: Id<"campaigns">;
    let parentFolderId: Id<"folders"> | undefined;

    if (args.parentFolderId) { // Creating child folder
      const parentFolder = await getFolderFn(ctx, args.parentFolderId);
      campaignId = parentFolder.campaignId;
      parentFolderId = args.parentFolderId;
    } else if (args.campaignId) { // Creating root folder
      campaignId = args.campaignId;
      parentFolderId = undefined;
    } else {
      throw new Error("Must provide either campaignId or parentFolderId");
    }

    const { identityWithProfile } = await requireCampaignMembership(ctx, { campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );
    const { profile } = identityWithProfile;

    return await ctx.db.insert("folders", {
      userId: profile.userId,
      name: args.name || "",
      campaignId,
      updatedAt: Date.now(),
      parentFolderId,
    });
  },
});

export const createNote = mutation({
  args: {
    name: v.optional(v.string()),
    parentFolderId: v.optional(v.id("folders")),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<Id<"notes">> => {
    const { identityWithProfile } = await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );
    const { profile } = identityWithProfile;

    const noteId = await ctx.db.insert("notes", {
      userId: profile.userId,
      name: args.name || "",
      parentFolderId: args.parentFolderId,
      updatedAt: Date.now(),
      campaignId: args.campaignId,
    });

    return noteId;
  },
});

export const addTagToBlockMutation = mutation({
  args: {
    noteId: v.id("notes"),
    blockId: v.string(), //TODO: change to Id<"blocks">
    tagId: v.id("tags"),
  },
  handler: async (ctx, args): Promise<string> => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    await requireCampaignMembership(ctx, { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

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
    blockId: v.string(), //TODO: change to Id<"blocks">
    tagId: v.id("tags"),
  },
  handler: async (ctx, args): Promise<string> => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    await requireCampaignMembership(ctx, { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

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
