import { query } from "../_generated/server";
import { v } from "convex/values";
import {
  Note,
  AnySidebarItem,
  Block,
  NoteWithContent,
  SIDEBAR_ITEM_TYPES,
  Folder,
} from "./types";
import { Id } from "../_generated/dataModel";
import {
  findBlock,
  filterOutChildBlocks,
  extractTagIdsFromBlockContent,
  getBlockLevelTags,
  getNoteLevelTag,
  getTagCategoryByName,
  doesBlockMatchRequiredTags,
  getTagsByCategory,
} from "../tags/tags";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { TagWithNote } from "../tags/types";
import { hasAccessToBlock } from "../tags/shared";
import { getSidebarItems as getSidebarItemsFn, getFolder as getFolderFn } from "./notes";

export const getFolder = query({
  args: {
    folderId: v.id("folders"),
  },
  handler: async (ctx, args): Promise<Folder> => {
    const folder = await getFolderFn(ctx, args.folderId);

    await requireCampaignMembership(ctx, { campaignId: folder.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const children = await getSidebarItemsFn(ctx, folder.campaignId, folder.categoryId, args.folderId);

    return {
      ...folder,
      children,
    };
  },
});

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

export const getSidebarItems = query({
  args: {
    campaignId: v.id("campaigns"),
    categoryId: v.optional(v.id("tagCategories")),
    parentId: v.optional(v.id("folders"))
  },
  handler: async (ctx, args): Promise<AnySidebarItem[]> => {
    await requireCampaignMembership(
      ctx,
      { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );
    return getSidebarItemsFn(ctx, args.campaignId, args.categoryId, args.parentId);
  },
});

// export const getSidebarData = query({
//   args: {
//     campaignId: v.id("campaigns"),
//   },
//   handler: async (ctx, args): Promise<AnySidebarItem[]> => {
//     await requireCampaignMembership(ctx, { campaignId: args.campaignId },
//       { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
//     );

//     const [folders, notes] = await Promise.all([
//       ctx.db
//         .query("folders")
//         .withIndex("by_campaign_parent", (q) =>
//           q.eq("campaignId", args.campaignId!),
//         )
//         .collect(),
//       ctx.db
//         .query("notes")
//         .withIndex("by_campaign_parent", (q) =>
//           q.eq("campaignId", args.campaignId!),
//         )
//         .collect(),
//     ]);

//     // Filter out notes that are associated with tags (they appear in system folders)
//     const tagLinkedNoteIds = new Set(
//       (
//         await ctx.db
//           .query("tags")
//           .withIndex("by_campaign_categoryId", (q) => q.eq("campaignId", args.campaignId!))
//           .collect()
//       )
//         .map((t) => t.noteId)
//         .filter((nid): nid is Id<"notes"> => Boolean(nid)),
//     );
//     const regularNotes = notes.filter((note) => !tagLinkedNoteIds.has(note._id));

//     const folderMap = new Map<Id<"folders">, FolderNode>();

//     folders.forEach((folder) => {
//       folderMap.set(folder._id, {
//         ...folder,
//         type: SIDEBAR_ITEM_TYPES.folders,
//         children: [],
//       });
//     });

//     folders.forEach((folder) => {
//       if (folder.parentFolderId) {
//         const parentNode = folderMap.get(folder.parentFolderId);
//         const node = folderMap.get(folder._id);
//         if (parentNode && node) {
//           parentNode.children.push(node);
//         }
//       }
//     });

//     const typedNotes = regularNotes.map((note) => ({
//       ...note,
//       type: SIDEBAR_ITEM_TYPES.notes,
//     })) as Note[];

//     typedNotes.forEach((note) => {
//       if (note.parentFolderId) {
//         const parentNode = folderMap.get(note.parentFolderId);
//         if (parentNode) {
//           parentNode.children.push(note);
//         }
//       }
//     });

//     const rootFolders = Array.from(folderMap.values()).filter(
//       (folder) => !folder.parentFolderId,
//     );

//     const rootNotes = typedNotes.filter((note) => !note.parentFolderId);

//     return [...rootFolders, ...rootNotes] as AnySidebarItem[];
//   },
// });

export const getBlocksByTags = query({
  args: {
    campaignId: v.id("campaigns"),
    tagIds: v.array(v.id("tags")),
  },
  handler: async (ctx, args): Promise<Block[]> => {
    const { campaignWithMembership } = await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
    );

    const allBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign_note_toplevel_pos", (q) =>
        q.eq("campaignId", args.campaignId!),
      )
      .collect();

    const checks = await Promise.all(
      allBlocks.map(async (block) => {
        try {
          const [hasSharedTag, matchesRequired] = await Promise.all([
            hasAccessToBlock(ctx, args.campaignId!, campaignWithMembership.member._id, block._id),
            doesBlockMatchRequiredTags(ctx, block._id, args.tagIds),
          ]);
          return hasSharedTag && matchesRequired ? block : null;
        } catch (error) {
          console.warn(`Error checking block access/tags for block ${block._id}:`, error);
          return null;
        }
      })
    );
    const matchingBlocks: Block[] = checks.filter(Boolean) as Block[];

    const noteGroups = new Map<Id<"notes">, Block[]>();
    matchingBlocks.forEach((block) => {
      if (!noteGroups.has(block.noteId)) {
        noteGroups.set(block.noteId, []);
      }
      noteGroups.get(block.noteId)!.push(block);
    });

    const filteredResults: Block[] = [];
    const matchedNoteIds = Array.from(noteGroups.keys());
    const topByNote = new Map<Id<"notes">, Block[]>();
    for (const b of allBlocks) {
      if (b.isTopLevel && matchedNoteIds.includes(b.noteId)) {
        const arr = topByNote.get(b.noteId) ?? [];
        arr.push(b);
        topByNote.set(b.noteId, arr);
      }
    }
    for (const [noteId, noteBlocks] of noteGroups) {
      const topLevelBlocks = (topByNote.get(noteId) ?? [])
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      const topLevelContent = topLevelBlocks
        .map((block) => block.content);

      const filtered = filterOutChildBlocks(noteBlocks, topLevelContent);
      filteredResults.push(...filtered);
    }

    return filteredResults;
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
    

    const blockTagIds = await getBlockLevelTags(ctx, block._id);
    const inlineTagIds = extractTagIdsFromBlockContent(block.content);
    const noteLevelTag = await getNoteLevelTag(ctx, note._id);


    const noteTagIdList = noteLevelTag ? [noteLevelTag._id] : [];
    const allTagIds = [...new Set([...blockTagIds, ...inlineTagIds, ...noteTagIdList])];

    return {
      allTagIds,
      inlineTagIds,
      blockTagIds,
      noteTagId: noteLevelTag?._id || null,
    };
  },
});

// export const getTagNotePages = query({
//   args: {
//     campaignId: v.id("campaigns"),
//     tagCategory: v.string(),
//   },
//   handler: async (ctx, args): Promise<TagWithNote[]> => {
//     await requireCampaignMembership(ctx, { campaignId: args.campaignId },
//       { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM, CAMPAIGN_MEMBER_ROLE.Player] }
//     );

//     const category = await getTagCategoryByName(ctx, args.campaignId, args.tagCategory);

//     if (!category) {
//       throw new Error(`Tag category "${args.tagCategory}" not found`);
//     }

//     const tags = await getTagsByCategory(ctx, category._id);

//     const tagNotePages = [];
//     for (const tag of tags) {
//       const note = tag.noteId ? await ctx.db.get(tag.noteId) : null;

//       if (note) {
//         tagNotePages.push({
//           ...tag,
//           note: {
//             ...note,
//             type: SIDEBAR_ITEM_TYPES.notes,
//           },
//         });
//       }
//     }

//     return tagNotePages;
//   },
// });
