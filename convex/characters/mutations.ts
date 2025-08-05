import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { verifyUserIdentity } from "../model/helpers";
import {
  insertTag,
  updateTagAndContent,
  deleteTagAndCleanupContent,
} from "../model/tags/helpers";

export const createCharacter = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);

    const tagId = await insertTag(ctx, {
      name: args.name,
      type: "Character",
      color: args.color,
      campaignId: args.campaignId,
    });

    const characterId = await ctx.db.insert("characters", {
      name: args.name,
      description: args.description,
      color: args.color,
      campaignId: args.campaignId,
      tagId,
      createdBy: identity.tokenIdentifier,
      updatedAt: Date.now(),
    });

    return characterId;
  },
});

export const updateCharacter = mutation({
  args: {
    characterId: v.id("characters"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    const characterUpdates: {
      name?: string;
      description?: string;
      color?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      characterUpdates.name = args.name;
    }
    if (args.description !== undefined) {
      characterUpdates.description = args.description;
    }
    if (args.color !== undefined) {
      characterUpdates.color = args.color;
    }

    await ctx.db.patch(args.characterId, characterUpdates);

    if (args.name !== undefined || args.color !== undefined) {
      await updateTagAndContent(
        ctx,
        character.tagId,
        character.campaignId,
        character.name,
        character.color,
        {
          name: args.name,
          color: args.color,
        },
      );
    }

    return args.characterId;
  },
});

export const deleteCharacter = mutation({
  args: {
    characterId: v.id("characters"),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    await deleteTagAndCleanupContent(ctx, character.tagId);

    await ctx.db.delete(args.characterId);

    return args.characterId;
  },
});
