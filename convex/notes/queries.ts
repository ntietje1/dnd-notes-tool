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
} from "../tags/helpers";
import { getBaseUserId, verifyUserIdentity } from "../model/helpers";
import { CustomBlock } from "../../app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";

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

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
      .collect();

    const matchingBlocks = blocks.filter((block) =>
      args.tagIds.every((tagId) => block.tagIds.includes(tagId)),
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

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
      .collect();

    const matchingBlocks = blocks.filter((block) =>
      block.tagIds.includes(args.tagId!),
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

export const getBlockTags = query({
  args: {
    noteId: v.id("notes"),
    blockId: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"tags">[]> => {
    await verifyUserIdentity(ctx);

    const block = await findBlock(ctx, args.noteId, args.blockId);
    return block?.tagIds || [];
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

    // Get inline tags from block content
    const inlineTagIds = extractTagIdsFromBlockContent(block.content);

    // Manual tags are those in the database that aren't inline
    const manualTagIds = block.tagIds.filter(
      (tagId) => !inlineTagIds.includes(tagId),
    );

    return {
      allTagIds: block.tagIds,
      inlineTagIds,
      manualTagIds,
    };
  },
});
