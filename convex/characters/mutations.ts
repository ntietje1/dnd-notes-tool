import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { deleteTagAndCleanupContent, getTag, getTagCategoryByName, insertTagAndNote } from "../tags/tags";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { Id } from "../_generated/dataModel";
import { SYSTEM_TAG_CATEGORY_NAMES } from "../tags/types";

export const createCharacter = mutation({
  args: {
    tagId: v.id("tags"),
    playerId: v.optional(v.id("campaignMembers")),
  },
  handler: async (ctx, args): Promise<Id<"characters">> => {
    console.log("createCharacter.playerId", args.playerId);
    const tag = await getTag(ctx, args.tagId);
    await requireCampaignMembership(ctx, { campaignId: tag.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const characterId = await ctx.db.insert("characters", {
      campaignId: tag.campaignId,
      tagId: tag._id,
      playerId: args.playerId,
    });

    return characterId;
  },
});

export const createCharacterFromForm = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    campaignId: v.id("campaigns"),
    playerId: v.optional(v.id("campaignMembers")),
  },
  handler: async (ctx, args): Promise<{ tagId: Id<"tags">; characterId: Id<"characters"> }> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const characterCategory = await getTagCategoryByName(ctx, args.campaignId, SYSTEM_TAG_CATEGORY_NAMES.Character);

    const { tagId, noteId } = await insertTagAndNote(ctx, {
      displayName: args.name.trim(),
      description: args.description,
      color: args.color,
      campaignId: args.campaignId,
      categoryId: characterCategory._id,
    });

    const characterId = await ctx.db.insert("characters", {
      campaignId: args.campaignId,
      tagId: tagId,
      playerId: args.playerId,
    });

    return { tagId, characterId };
  },
});

export const updateCharacter = mutation({
  args: {
    characterId: v.id("characters"),
    playerId: v.optional(v.id("campaignMembers")),
  },
  handler: async (ctx, args): Promise<Id<"characters">> => {
    console.log("updateCharacter.playerId", args.playerId);
    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    await requireCampaignMembership(ctx, { campaignId: character.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    await ctx.db.patch(args.characterId, {
      playerId: args.playerId,
    });

    return args.characterId;
  },
});

export const deleteCharacter = mutation({
  args: {
    characterId: v.id("characters"),
  },
  handler: async (ctx, args): Promise<Id<"characters">> => {
    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    await requireCampaignMembership(ctx, { campaignId: character.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    await deleteTagAndCleanupContent(ctx, character.tagId);
    await ctx.db.delete(args.characterId);

    return args.characterId;
  },
});
