import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  Note,
  FolderNode,
  AnySidebarItem,
  Block,
  NoteWithContent,
  SIDEBAR_ITEM_TYPES,
} from "./types";
import { Id } from "../_generated/dataModel";
import {
  findBlock,
  filterOutChildBlocks,
  extractTagIdsFromBlockContent,
  getBlockTags,
} from "../tags/tags";
import { SYSTEM_TAGS } from "../tags/types";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";

export const getNote = query({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args): Promise<NoteWithContent> => {
    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    await requireCampaignMembership(ctx, { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const topLevelBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign_note_toplevel_pos", (q) =>
        q
          .eq("campaignId", note.campaignId)
          .eq("noteId", note._id)
          .eq("isTopLevel", true),
      )
      .collect();

    const allBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign_note_toplevel_pos", (q) =>
        q.eq("campaignId", note.campaignId).eq("noteId", note._id),
      )
      .collect();

    const blocksMap = new Map(
      allBlocks.map((block) => [block.blockId, block.content]),
    );

    function reconstructContent(content: any): any {
      if (Array.isArray(content)) {
        return content.map(reconstructContent);
      } else if (content && typeof content === "object" && content.id) {
        const dbBlock = blocksMap.get(content.id);
        if (dbBlock) {
          return {
            ...dbBlock,
            content: dbBlock.content
              ? reconstructContent(dbBlock.content)
              : dbBlock.content,
          };
        }
        return {
          ...content,
          content: content.content
            ? reconstructContent(content.content)
            : content.content,
        };
      } else if (content && typeof content === "object") {
        const reconstructed: any = {};
        for (const [key, value] of Object.entries(content)) {
          reconstructed[key] = reconstructContent(value);
        }
        return reconstructed;
      }
      return content;
    }

    const content = topLevelBlocks.map((block) =>
      reconstructContent(block.content),
    );

    return {
      ...note,
      type: SIDEBAR_ITEM_TYPES.notes,
      content,
    };
  },
});

export const getSidebarData = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<AnySidebarItem[]> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const [folders, notes] = await Promise.all([
      ctx.db
        .query("folders")
        .withIndex("by_campaign_parent", (q) =>
          q.eq("campaignId", args.campaignId!),
        )
        .collect(),
      ctx.db
        .query("notes")
        .withIndex("by_campaign_parent", (q) =>
          q.eq("campaignId", args.campaignId!),
        )
        .collect(),
    ]);

    // Filter out notes that are associated with tags (they appear in system folders)
    const regularNotes = notes.filter((note) => !note.tagId);

    const folderMap = new Map<Id<"folders">, FolderNode>();

    folders.forEach((folder) => {
      folderMap.set(folder._id, {
        ...folder,
        type: SIDEBAR_ITEM_TYPES.folders,
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

    const typedNotes = regularNotes.map((note) => ({
      ...note,
      type: SIDEBAR_ITEM_TYPES.notes,
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
    campaignId: v.id("campaigns"),
    tagIds: v.array(v.id("tags")),
  },
  handler: async (ctx, args): Promise<Block[]> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
    );

    const sharedTag = await ctx.db
      .query("tags")
      .withIndex("by_campaign_name", (q) =>
        q.eq("campaignId", args.campaignId!).eq("name", SYSTEM_TAGS.shared),
      )
      .unique();

    if (!sharedTag) {
      throw new Error("Shared tag not found, this should be impossible");
    }

    const allBlockTags = await ctx.db.query("blockTags").collect();

    const blockTagsMap = new Map<Id<"blocks">, Id<"tags">[]>();
    const sharedTagCreationMap = new Map<Id<"blocks">, number>();

    allBlockTags.forEach((bt) => {
      if (!blockTagsMap.has(bt.blockId)) {
        blockTagsMap.set(bt.blockId, []);
      }
      blockTagsMap.get(bt.blockId)!.push(bt.tagId);

      if (bt.tagId === sharedTag._id) {
        sharedTagCreationMap.set(bt.blockId, bt.createdAt);
      }
    });

    const allBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign_note_toplevel_pos", (q) =>
        q.eq("campaignId", args.campaignId!),
      )
      .collect();

    const requiredTagIds = [sharedTag._id, ...args.tagIds];
    const matchingBlocks = allBlocks.filter((block) => {
      const blockTagIds = blockTagsMap.get(block._id) || [];
      return requiredTagIds.every((tagId) => blockTagIds.includes(tagId));
    });

    const noteGroups = new Map<Id<"notes">, Block[]>();
    matchingBlocks.forEach((block) => {
      if (!noteGroups.has(block.noteId)) {
        noteGroups.set(block.noteId, []);
      }
      noteGroups.get(block.noteId)!.push(block);
    });

    const filteredResults: Block[] = [];
    for (const [noteId, noteBlocks] of noteGroups) {
      const topLevelBlocks = await ctx.db
        .query("blocks")
        .withIndex("by_campaign_note_toplevel_pos", (q) =>
          q
            .eq("campaignId", args.campaignId!)
            .eq("noteId", noteId)
            .eq("isTopLevel", true),
        )
        .collect();

      const topLevelContent = topLevelBlocks
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((block) => block.content);

      const filtered = filterOutChildBlocks(noteBlocks, topLevelContent);
      filteredResults.push(...filtered);
    }

    return filteredResults.sort((a, b) => {
      const aCreatedAt = sharedTagCreationMap.get(a._id) || 0;
      const bCreatedAt = sharedTagCreationMap.get(b._id) || 0;
      return bCreatedAt - aCreatedAt;
    });
  },
});

export const getBlockTagState = query({
  args: {
    noteId: v.id("notes"),
    blockId: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    allTagIds: Id<"tags">[];
    inlineTagIds: Id<"tags">[];
    blockTagIds: Id<"tags">[];
    noteTagId: Id<"tags"> | null;
  }> => {
    const note = await ctx.db.get(args.noteId);
    if (!note) throw new Error("Note not found");
    
    await requireCampaignMembership(ctx, { campaignId: note.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
    );

    const block = await findBlock(ctx, args.noteId, args.blockId);
    if (!block) throw new Error("Block not found");
    

    const blockTagIds = await getBlockTags(ctx, block._id);
    const inlineTagIds = extractTagIdsFromBlockContent(block.content);

    const manualTagIds = blockTagIds.filter(
      (tagId) => !inlineTagIds.includes(tagId) && note.tagId !== tagId,
    );

    const noteTagIdList = note.tagId ? [note.tagId] : [];
    const allTagIds = [
      ...new Set([...blockTagIds, ...inlineTagIds, ...noteTagIdList]),
    ];

    return {
      allTagIds,
      inlineTagIds,
      blockTagIds: manualTagIds,
      noteTagId: note.tagId || null,
    };
  },
});

export const getTagNotePages = query({
  args: {
    campaignId: v.id("campaigns"),
    tagType: v.union(
      v.literal("Character"),
      v.literal("Location"),
      v.literal("Session"),
      v.literal("System"),
      v.literal("Other"),
    ),
  },
  handler: async (ctx, args): Promise<Note[]> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
    );

    const tags = await ctx.db
      .query("tags")
      .withIndex("by_campaign_type", (q) =>
        q.eq("campaignId", args.campaignId).eq("type", args.tagType),
      )
      .collect();

    const tagNotePages = [];
    for (const tag of tags) {
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_campaign_tag", (q) =>
          q.eq("campaignId", args.campaignId).eq("tagId", tag._id),
        )
        .collect();

      for (const note of notes) {
        tagNotePages.push({
          ...note,
          type: SIDEBAR_ITEM_TYPES.notes,
          tagName: tag.name,
          tagColor: tag.color,
          tagType: tag.type,
        });
      }
    }

    return tagNotePages;
  },
});
