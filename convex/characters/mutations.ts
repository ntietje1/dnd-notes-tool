import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { verifyUserIdentity } from "../model/helpers";

export const createCharacter = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyUserIdentity(ctx);

    const tagId = await ctx.db.insert("tags", {
      name: args.name,
      type: "character",
      color: args.color,
      campaignId: args.campaignId,
      updatedAt: Date.now(),
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
      const tagUpdates: {
        name?: string;
        color?: string;
        updatedAt: number;
      } = {
        updatedAt: Date.now(),
      };

      if (args.name !== undefined) {
        tagUpdates.name = args.name;
      }
      if (args.color !== undefined) {
        tagUpdates.color = args.color;
      }

      await ctx.db.patch(character.tagId, tagUpdates);

      if (args.name !== undefined || args.color !== undefined) {
        const newName = args.name ?? character.name;
        const newColor = args.color ?? character.color;

        const allBlocks = await ctx.db
          .query("blocks")
          .withIndex("by_campaign_note_toplevel_pos", (q) =>
            q.eq("campaignId", character.campaignId),
          )
          .collect();

        const updateTagsInContent = (content: any): any => {
          if (Array.isArray(content)) {
            return content.map(updateTagsInContent);
          } else if (content && typeof content === "object") {
            if (content.type === "tag" && content.props?.tagId === character.tagId) {
              return {
                ...content,
                props: {
                  ...content.props,
                  tagName: newName,
                  tagColor: newColor,
                },
              };
            }

            const updatedContent = { ...content };
            if (content.content) {
              updatedContent.content = updateTagsInContent(content.content);
            }
            if (content.children) {
              updatedContent.children = updateTagsInContent(content.children);
            }

            return updatedContent;
          }
          return content;
        };

        for (const block of allBlocks) {
          const updatedContent = updateTagsInContent(block.content);

          if (JSON.stringify(updatedContent) !== JSON.stringify(block.content)) {
            await ctx.db.patch(block._id, {
              content: updatedContent,
              updatedAt: Date.now(),
            });
          }
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
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    const character = await ctx.db.get(args.characterId);
    if (!character) {
      throw new Error("Character not found");
    }

    //TODO: modify all tags in content to just be text without being an actual tag inline content

    await ctx.db.delete(character.tagId);

    await ctx.db.delete(args.characterId);

    return args.characterId;
  },
}); 