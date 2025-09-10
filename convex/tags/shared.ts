import { Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import { getEffectiveTagIdsForBlock, insertTag } from "./tags";
import { SHARED_TAG_COLOR, SYSTEM_TAG_CATEGORY_NAMES, Tag, TagCategory } from "./types";
import { Ctx } from "../common/types";

export async function getSharedCategory(
    ctx: Ctx,
    campaignId: Id<"campaigns">
): Promise<TagCategory> {
    const sharedCategory = await ctx.db
        .query("tagCategories")
        .withIndex("by_campaign_name", (q) => q.eq("campaignId", campaignId).eq("name", SYSTEM_TAG_CATEGORY_NAMES.Shared.toLowerCase()),
        )
        .unique();
    if (!sharedCategory) {
        throw new Error("Shared category should exist but was not found");
    }
    return sharedCategory;
}

export async function getSharedAllTag(
    ctx: Ctx,
    campaignId: Id<"campaigns">
): Promise<Tag> {
    const sharedCategory = await getSharedCategory(ctx, campaignId);
    const sharedTags = await ctx.db
        .query("tags")
        .withIndex("by_campaign_categoryId", (q) =>
        q.eq("campaignId", campaignId).eq("categoryId", sharedCategory._id),
        )
        .collect();
    const sharedAllTag = sharedTags.find((t) => t.name === SYSTEM_TAG_CATEGORY_NAMES.Shared.toLowerCase());
    if (!sharedAllTag) {
        console.error("All shared tag should exist but was not found");
        throw new Error("All shared tag should exist but was not found");
    }
    return sharedAllTag;
}

export async function ensureSharedAllTag(
    ctx: MutationCtx,
    campaignId: Id<"campaigns">
): Promise<Id<"tags">> {
    try {
        return (await getSharedAllTag(ctx, campaignId))._id;
    } catch (error) {
        const sharedCategory = await getSharedCategory(ctx, campaignId);
        return await insertTag(
            ctx,
            {
                displayName: SYSTEM_TAG_CATEGORY_NAMES.Shared,
                color: "#F59E0B",
                description: "Visible to all players",
                campaignId,
                categoryId: sharedCategory._id,
            },
            true,
        );
    }
}

export async function getPlayerSharedTags(
    ctx: Ctx,
    campaignId: Id<"campaigns">,
): Promise<Tag[]> {
    const sharedCategory = await getSharedCategory(ctx, campaignId);
    const sharedTags = await ctx.db
        .query("tags")
        .withIndex("by_campaign_categoryId", (q) =>
        q.eq("campaignId", campaignId).eq("categoryId", sharedCategory._id),
        )
        .collect()
        .then((tags) => tags.filter((t) => !!t.memberId));
    return sharedTags;
}


export async function getPlayerSharedTag(
    ctx: Ctx,
    campaignId: Id<"campaigns">,
    memberId: Id<"campaignMembers">
): Promise<Tag> {
    const sharedCategory = await getSharedCategory(ctx, campaignId);
    const sharedTags = await ctx.db
        .query("tags")
        .withIndex("by_campaign_categoryId", (q) =>
        q.eq("campaignId", campaignId).eq("categoryId", sharedCategory._id),
        )
        .collect();
    const playerSharedTag = sharedTags.find((t) => t.memberId === memberId);
    if (!playerSharedTag) {
        console.error("Player shared tag should exist but was not found");
        throw new Error("Player shared tag should exist but was not found");
    }
    return playerSharedTag;
}

export async function ensurePlayerSharedTag(
    ctx: MutationCtx,
    campaignId: Id<"campaigns">,
    memberId: Id<"campaignMembers">
): Promise<Id<"tags">> {
    const sharedCategory = await getSharedCategory(ctx, campaignId);
    const sharedTags = await ctx.db
        .query("tags")
        .withIndex("by_campaign_categoryId", (q) =>
        q.eq("campaignId", campaignId).eq("categoryId", sharedCategory._id),
        )
        .collect();
    
    const playerSharedTag = sharedTags.find((t) => t.memberId === memberId);
    if (!playerSharedTag) {
        return await insertTag(
            ctx,
            {
                displayName: "Shared: (Player)",
                color: "#F59E0B",
                description: "Visible to a specific player",
                campaignId,
                memberId,
                categoryId: sharedCategory._id,
            },
            true,
        );
    }
    return playerSharedTag._id;
}

export async function ensureAllPlayerSharedTags(
    ctx: MutationCtx,
    campaignId: Id<"campaigns">
): Promise<void> {
    const campaignMembers = await ctx.db
        .query("campaignMembers")
        .withIndex("by_campaign", (q) => q.eq("campaignId", campaignId))
        .collect();

    const sharedCategory = await getSharedCategory(ctx, campaignId);
    const existing = await ctx.db
        .query("tags")
        .withIndex("by_campaign_categoryId", (q) =>
            q.eq("campaignId", campaignId).eq("categoryId", sharedCategory._id),
        )
        .collect();
    const existingMemberIds = new Set(
        existing
            .filter((t) => !!t.memberId)
            .map((t) => t.memberId),
    );
    const missingMembers = campaignMembers.filter(
        (m) => !existingMemberIds.has(m._id),
    );

    await Promise.all(
        missingMembers.map((member) =>
            insertTag(
                ctx,
                {
                    displayName: "Shared: (Player)",
                    color: SHARED_TAG_COLOR,
                    description: "Visible to a specific player",
                    campaignId,
                    memberId: member._id,
                    categoryId: sharedCategory._id,
                },
                true,
            ),
        ),
    );
}

export async function hasAccessToBlock(
    ctx: Ctx,
    campaignId: Id<"campaigns">,
    memberId: Id<"campaignMembers">,
    blockId: Id<"blocks">
): Promise<boolean> {
    const sharedAllTag = await getSharedAllTag(ctx, campaignId);
    const playerSharedTag = await getPlayerSharedTag(ctx, campaignId, memberId);
    const blockTagIds = await getEffectiveTagIdsForBlock(ctx, blockId);
    return blockTagIds.includes(sharedAllTag._id) || blockTagIds.includes(playerSharedTag._id);
}


