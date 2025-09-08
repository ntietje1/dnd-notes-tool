import { v } from "convex/values";
import { query } from "../_generated/server";
import { CharacterWithTag } from "./types";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { SYSTEM_TAG_CATEGORY_NAMES } from "../tags/types";

export const getCharactersByCampaign = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<CharacterWithTag[]> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    ); //TODO: allow players to see characters that have been "introduced" to them

    const characters = await ctx.db
      .query("characters")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();

    const charactersWithTags = await Promise.all(
      characters.map(async (character) => {
        const tag = await ctx.db.get(character.tagId);
        if (!tag) {
          throw new Error(`Tag not found for character ${character._id}`);
        }

        return {
          ...character,
          tag: tag,
        };
      }),
    );

    return charactersWithTags.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getCharacterById = query({
  args: {
    characterId: v.id("characters"),
  },
  handler: async (ctx, args): Promise<CharacterWithTag> => {
    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error(`Character not found: ${args.characterId}`);
    }

    await requireCampaignMembership(ctx, { campaignId: character.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    ); //TODO: allow players to see characters that have been "introduced" to them
    
    const tag = await ctx.db.get(character.tagId);
    if (!tag) {
      throw new Error(`Tag not found for character ${character._id}`);
    }

    return {
      ...character,
      tag: tag,
    };
  },
});