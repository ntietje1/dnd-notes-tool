import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  Note,
  FolderNode,
  AnySidebarItem,
  Block,
  NoteWithContent,
} from "./types";
import { Id } from "../_generated/dataModel";
import {
  findBlock,
  filterOutChildBlocks,
  extractTagIdsFromBlockContent,
  getBlockTags,
} from "../tags/helpers";
import { getBaseUserId, verifyUserIdentity } from "../model/helpers";
import { CustomBlock } from "../../app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";
import { SYSTEM_TAGS } from "../tags/types";

export const getNote = query({
  args: {
    noteId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<NoteWithContent | null> => {
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
      type: "notes" as const,
      content,
    };
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
  },
  handler: async (ctx, args): Promise<Block[]> => {
    await verifyUserIdentity(ctx);

    if (!args.campaignId || args.tagIds.length === 0) {
      return [];
    }

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

export const getBlockTagIds = query({
  args: {
    noteId: v.id("notes"),
    blockId: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"tags">[]> => {
    await verifyUserIdentity(ctx);

    const block = await findBlock(ctx, args.noteId, args.blockId);
    if (!block) {
      return [];
    }

    return await getBlockTags(ctx, block._id);
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
    manualTagIds: Id<"tags">[];
  }> => {
    await verifyUserIdentity(ctx);

    const block = await findBlock(ctx, args.noteId, args.blockId);

    if (!block) {
      return {
        allTagIds: [],
        inlineTagIds: [],
        manualTagIds: [],
      };
    }

    const allTagIds = await getBlockTags(ctx, block._id);

    const inlineTagIds = extractTagIdsFromBlockContent(block.content);

    const manualTagIds = allTagIds.filter(
      (tagId) => !inlineTagIds.includes(tagId),
    );

    return {
      allTagIds,
      inlineTagIds,
      manualTagIds,
    };
  },
});

// export const getTagNotePages = query({
//   args: {
//     tagType: v.string(),
//   },
//   handler: async (ctx, args): Promise<Note[]> => {
//     await verifyUserIdentity(ctx);
//   },
// });
