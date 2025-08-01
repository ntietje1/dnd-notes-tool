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

    // Get all blocks for this note (both top-level and nested)
    const allBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_note", (q) => q.eq("noteId", note._id))
      .collect();

    // Separate top-level blocks and create a map of all blocks
    const topLevelBlocks = allBlocks
      .filter((block) => block.isTopLevel)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    const blocksMap = new Map(
      allBlocks.map((block) => [block.blockId, block.content]),
    );

    // Reconstruct content, ensuring nested tagged blocks are properly included
    function reconstructContent(content: any): any {
      if (Array.isArray(content)) {
        return content.map(reconstructContent);
      } else if (content && typeof content === "object" && content.id) {
        // Check if we have an updated version of this block in the database
        const dbBlock = blocksMap.get(content.id);
        if (dbBlock) {
          // Use the database version, but recursively reconstruct its content too
          return {
            ...dbBlock,
            content: dbBlock.content
              ? reconstructContent(dbBlock.content)
              : dbBlock.content,
          };
        }
        // Recursively reconstruct nested content
        return {
          ...content,
          content: content.content
            ? reconstructContent(content.content)
            : content.content,
        };
      } else if (content && typeof content === "object") {
        // Recursively reconstruct object properties
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
    includeNoteLevel: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Block[]> => {
    await verifyUserIdentity(ctx);

    if (!args.campaignId || args.tagIds.length === 0) {
      return [];
    }

    // Get the shared tag
    const sharedTag = await ctx.db
      .query("tags")
      .withIndex("by_name", (q) =>
        q.eq("campaignId", args.campaignId!).eq("name", SYSTEM_TAGS.shared),
      )
      .unique();

    if (!sharedTag) {
      throw new Error("Shared tag not found, this should be impossible");
    }

    // Get all blocks in the campaign
    const allBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
      .collect();

    // Get all blockTags relationships for these blocks
    const allBlockTags = await ctx.db.query("blockTags").collect();

    // Create a map of block ID to tag IDs
    const blockTagsMap = new Map<Id<"blocks">, Id<"tags">[]>();
    allBlockTags.forEach((bt) => {
      if (!blockTagsMap.has(bt.blockId)) {
        blockTagsMap.set(bt.blockId, []);
      }
      blockTagsMap.get(bt.blockId)!.push(bt.tagId);
    });

    // Filter blocks that have all required tags (including shared tag)
    const requiredTagIds = [sharedTag._id, ...args.tagIds];
    const matchingBlocks = allBlocks.filter((block) => {
      const blockTagIds = blockTagsMap.get(block._id) || [];
      return requiredTagIds.every((tagId) => blockTagIds.includes(tagId));
    });

    // Group blocks by noteId to reconstruct content for filtering
    const noteIds = [...new Set(matchingBlocks.map((b) => b.noteId))];

    // Reconstruct content for each note to determine parent-child relationships
    const noteContentMap = new Map<Id<"notes">, CustomBlock[]>();
    for (const noteId of noteIds) {
      // Get top-level blocks for this note to reconstruct content
      const topLevelBlocks = await ctx.db
        .query("blocks")
        .withIndex("by_note", (q) => q.eq("noteId", noteId))
        .filter((q) => q.eq(q.field("isTopLevel"), true))
        .collect();

      const sortedBlocks = topLevelBlocks.sort(
        (a, b) => (a.position || 0) - (b.position || 0),
      );
      const content = sortedBlocks.map((block) => block.content);
      noteContentMap.set(noteId, content);
    }

    // Filter out child blocks for each note separately
    const noteGroups = new Map<Id<"notes">, Block[]>();
    matchingBlocks.forEach((block) => {
      if (!noteGroups.has(block.noteId)) {
        noteGroups.set(block.noteId, []);
      }
      noteGroups.get(block.noteId)!.push(block);
    });

    const filteredResults: Block[] = [];
    for (const [noteId, noteBlocks] of noteGroups) {
      const noteContent = noteContentMap.get(noteId);
      if (noteContent) {
        const filtered = filterOutChildBlocks(noteBlocks, noteContent);
        filteredResults.push(...filtered);
      } else {
        // If we can't get content, include all blocks (fallback)
        filteredResults.push(...noteBlocks);
      }
    }

    return filteredResults.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getBlocksByTag = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
    tagId: v.optional(v.id("tags")),
  },
  handler: async (ctx, args): Promise<Block[]> => {
    await verifyUserIdentity(ctx);

    if (!args.campaignId || !args.tagId) {
      return [];
    }

    // Get all blockTags for this tag
    const blockTags = await ctx.db
      .query("blockTags")
      .withIndex("by_tag", (q) => q.eq("tagId", args.tagId!))
      .collect();

    if (blockTags.length === 0) {
      return [];
    }

    // Get all blocks that have this tag
    const blockIds = blockTags.map((bt) => bt.blockId);
    const blocks = await Promise.all(
      blockIds.map((blockId) => ctx.db.get(blockId)),
    );

    // Filter out null blocks and blocks not in the campaign
    const matchingBlocks = blocks.filter(
      (block): block is Block =>
        block !== null && block.campaignId === args.campaignId,
    );

    // Group blocks by noteId to reconstruct content for filtering
    const noteIds = [...new Set(matchingBlocks.map((b) => b.noteId))];

    // Reconstruct content for each note to determine parent-child relationships
    const noteContentMap = new Map<Id<"notes">, CustomBlock[]>();
    for (const noteId of noteIds) {
      // Get top-level blocks for this note to reconstruct content
      const topLevelBlocks = await ctx.db
        .query("blocks")
        .withIndex("by_note", (q) => q.eq("noteId", noteId))
        .filter((q) => q.eq(q.field("isTopLevel"), true))
        .collect();

      const sortedBlocks = topLevelBlocks.sort(
        (a, b) => (a.position || 0) - (b.position || 0),
      );
      const content = sortedBlocks.map((block) => block.content);
      noteContentMap.set(noteId, content);
    }

    // Filter out child blocks for each note separately
    const noteGroups = new Map<Id<"notes">, Block[]>();
    matchingBlocks.forEach((block) => {
      if (!noteGroups.has(block.noteId)) {
        noteGroups.set(block.noteId, []);
      }
      noteGroups.get(block.noteId)!.push(block);
    });

    const filteredResults: Block[] = [];
    for (const [noteId, noteBlocks] of noteGroups) {
      const noteContent = noteContentMap.get(noteId);
      if (noteContent) {
        const filtered = filterOutChildBlocks(noteBlocks, noteContent);
        filteredResults.push(...filtered);
      } else {
        // If we can't get content, include all blocks (fallback)
        filteredResults.push(...noteBlocks);
      }
    }

    return filteredResults.sort((a, b) => b.updatedAt - a.updatedAt);
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

    // Get all tags for this block from junction table
    const allTagIds = await getBlockTags(ctx, block._id);

    // Get inline tags from block content
    const inlineTagIds = extractTagIdsFromBlockContent(block.content);

    // Manual tags are those in the database that aren't inline
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
