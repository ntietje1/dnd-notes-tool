import { v } from "convex/values";
import { mutation } from "../_generated/server";
import {
  updateTagAndContent,
  deleteTagAndCleanupContent,
  getTagCategoryByName,
  insertTagAndNote,
} from "../tags/tags";
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
    const { identityWithProfile } = await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );
    const { profile } = identityWithProfile;

    const characterCategory = await getTagCategoryByName(ctx, args.campaignId, SYSTEM_TAG_CATEGORY_NAMES.Character);

    const { tagId, noteId } = await insertTagAndNote(ctx, {
      name: args.name,
      displayName: args.name,
      categoryId: characterCategory._id,
      color: args.color,
      campaignId: args.campaignId,
      description: args.description,
    });

    const characterId = await ctx.db.insert("characters", {
      name: args.name,
      description: args.description,
      color: args.color,
      campaignId: args.campaignId,
      tagId,
      createdBy: profile.userId,
      updatedAt: Date.now(),
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

      // Also update the associated note name if character name changed
      if (args.name !== undefined) {
        const tag = await ctx.db.get(character.tagId);
        if (!tag) {
          throw new Error("Character tag not found");
        }
        if (!tag.noteId) {
          throw new Error("Character note not found");
        }
        const associatedNote = await ctx.db.get(tag.noteId);

        if (associatedNote) {
          await ctx.db.patch(associatedNote._id, {
            name: args.name,
            updatedAt: Date.now(),
          });
        }
      }
    }

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
