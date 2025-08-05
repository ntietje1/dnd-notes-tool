import { v } from "convex/values";
import { query } from "../_generated/server";
import { verifyUserIdentity } from "../common/identity";
import { CharacterWithTag } from "./types";

export const getCharactersByCampaign = query({
  args: {
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<CharacterWithTag[]> => {
    await verifyUserIdentity(ctx);

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
          tag: {
            _id: tag._id,
            name: tag.name,
            color: tag.color,
            type: tag.type as "Character",
          },
        };
      })
    );

    return charactersWithTags.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getCharacterById = query({
  args: {
    characterId: v.id("characters"),
  },
  handler: async (ctx, args): Promise<CharacterWithTag | null> => {
    await verifyUserIdentity(ctx);

    const character = await ctx.db.get(args.characterId);
    if (!character) {
      return null;
    }

    const tag = await ctx.db.get(character.tagId);
    if (!tag) {
      throw new Error(`Tag not found for character ${character._id}`);
    }

    return {
      ...character,
      tag: {
        _id: tag._id,
        name: tag.name,
        color: tag.color,
        type: tag.type as "Character",
      },
    };
  },
});

export const getCharacterByTag = query({
  args: {
    tagId: v.id("tags"),
  },
  handler: async (ctx, args): Promise<CharacterWithTag | null> => {
    await verifyUserIdentity(ctx);

    const character = await ctx.db
      .query("characters")
      .withIndex("by_tag", (q) => q.eq("tagId", args.tagId))
      .first();

    if (!character) {
      return null;
    }

    const tag = await ctx.db.get(character.tagId);
    if (!tag) {
      throw new Error(`Tag not found for character ${character._id}`);
    }

    return {
      ...character,
      tag: {
        _id: tag._id,
        name: tag.name,
        color: tag.color,
        type: tag.type as "Character",
      },
    };
  },
}); 