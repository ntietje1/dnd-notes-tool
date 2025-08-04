import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { verifyUserIdentity } from "../model/helpers";

export const createLocation = mutation({
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
      type: "location",
      color: args.color,
      campaignId: args.campaignId,
      updatedAt: Date.now(),
    });

    const locationId = await ctx.db.insert("locations", {
      name: args.name,
      description: args.description,
      color: args.color,
      campaignId: args.campaignId,
      tagId,
      createdBy: identity.tokenIdentifier,
      updatedAt: Date.now(),
    });

    return locationId;
  },
});

export const updateLocation = mutation({
  args: {
    locationId: v.id("locations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    const locationUpdates: {
      name?: string;
      description?: string;
      color?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      locationUpdates.name = args.name;
    }
    if (args.description !== undefined) {
      locationUpdates.description = args.description;
    }
    if (args.color !== undefined) {
      locationUpdates.color = args.color;
    }

    await ctx.db.patch(args.locationId, locationUpdates);

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

      await ctx.db.patch(location.tagId, tagUpdates);

      if (args.name !== undefined || args.color !== undefined) {
        const newName = args.name ?? location.name;
        const newColor = args.color ?? location.color;

        const allBlocks = await ctx.db
          .query("blocks")
          .withIndex("by_campaign_note_toplevel_pos", (q) =>
            q.eq("campaignId", location.campaignId),
          )
          .collect();

        const updateTagsInContent = (content: any): any => {
          if (Array.isArray(content)) {
            return content.map(updateTagsInContent);
          } else if (content && typeof content === "object") {
            if (content.type === "tag" && content.props?.tagId === location.tagId) {
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

    return args.locationId;
  },
});

export const deleteLocation = mutation({
  args: {
    locationId: v.id("locations"),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

     //TODO: modify all tags in content to just be text without being an actual tag inline content

    await ctx.db.delete(location.tagId);

    await ctx.db.delete(args.locationId);

    return args.locationId;
  },
}); 