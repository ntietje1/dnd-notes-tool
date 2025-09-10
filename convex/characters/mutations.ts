import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { updateTagAndContent, deleteTagAndCleanupContent, getTagCategoryByName, insertTagAndNote, getTag } from "../tags/tags";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { Id } from "../_generated/dataModel";
import { SYSTEM_TAG_CATEGORY_NAMES } from "../tags/types";

export const createCharacter = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<{ characterId: Id<"characters">, tagId: Id<"tags">, noteId: Id<"notes"> }> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const characterCategory = await getTagCategoryByName(ctx, args.campaignId, SYSTEM_TAG_CATEGORY_NAMES.Character);

    const { tagId, noteId } = await insertTagAndNote(ctx, {
      displayName: args.name,
      categoryId: characterCategory._id,
      color: args.color,
      campaignId: args.campaignId,
      description: args.description,
    });
    const characterId = await ctx.db.insert("characters", {
      campaignId: args.campaignId,
      tagId,
    });

    return { characterId, tagId, noteId };
  },
});

export const updateCharacter = mutation({
  args: {
    characterId: v.id("characters"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"characters">> => {
    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    await requireCampaignMembership(ctx, { campaignId: character.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const tag = await getTag(ctx, character.tagId);

    await updateTagAndContent(
      ctx,
      tag._id,
      {
        displayName: args.name,
        color: args.color,
        description: args.description,
      },
    );


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
