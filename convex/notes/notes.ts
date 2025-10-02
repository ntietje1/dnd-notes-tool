import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { Ctx } from "../common/types";
import { Id } from "../_generated/dataModel";
import { AnySidebarItem, Folder, SIDEBAR_ITEM_TYPES } from "./types";

export const getFolder = async (ctx: Ctx, folderId: Id<"folders">): Promise<Folder> => {
    const folder = await ctx.db.get(folderId);
    if (!folder) {
        throw new Error("Folder not found");
    }
    await requireCampaignMembership(ctx, { campaignId: folder.campaignId },
        { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );
    return {
        ...folder,
        type: SIDEBAR_ITEM_TYPES.folders,
    };
}

export const getSidebarItems = async (ctx: Ctx, campaignId: Id<"campaigns">, categoryId?: Id<"tagCategories">, parentId?: Id<"folders">): Promise<AnySidebarItem[]> => {
    await requireCampaignMembership(ctx, { campaignId: campaignId },
        { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const folders = await ctx.db
        .query("folders")
        .withIndex("by_campaign_category_parent", (q) =>
            q.eq("campaignId", campaignId).eq("categoryId", categoryId).eq("parentFolderId", parentId),
        ).collect().then((folders) => folders.map((folder) => ({
            ...folder,
            type: SIDEBAR_ITEM_TYPES.folders,
        }))
    );

    const notes = await ctx.db
        .query("notes")
        .withIndex("by_campaign_category_parent", (q) =>
            q.eq("campaignId", campaignId).eq("categoryId", categoryId).eq("parentFolderId", parentId),
        )
        .collect()
        .then((notes) => notes.map((note) => ({
            ...note,
            type: SIDEBAR_ITEM_TYPES.notes,
        }))
    );

    return [...folders, ...notes] as AnySidebarItem[];
}