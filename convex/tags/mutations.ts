import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { verifyUserIdentity } from "../common/identity";
import { insertTag } from "./helpers";

export const createTag = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("Character"),
      v.literal("Location"),
      v.literal("Session"),
      v.literal("System"),
      v.literal("Other"),
    ),
    color: v.string(),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    if (args.type === "System") {
      throw new Error("System tags cannot be created");
    }

    // Use insertTag helper to ensure note page is created
    const tagId = await insertTag(ctx, {
      name: args.name,
      type: args.type,
      color: args.color,
      campaignId: args.campaignId,
    });

    return tagId;
  },
});

export const updateTag = mutation({
  args: {
    tagId: v.id("tags"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    const tag = await ctx.db.get(args.tagId);
    if (!tag) {
      throw new Error("Tag not found");
    }

    if (tag.type === "System") {
      throw new Error("System tags cannot be updated");
    }

    const updates: { name?: string; color?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.color !== undefined) {
      updates.color = args.color;
    }

    await ctx.db.patch(args.tagId, updates);

    if (args.name !== undefined || args.color !== undefined) {
      const newName = args.name ?? tag.name;
      const newColor = args.color ?? tag.color;

      const allBlocks = await ctx.db
        .query("blocks")
        .withIndex("by_campaign_note_toplevel_pos", (q) =>
          q.eq("campaignId", tag.campaignId),
        )
        .collect();

      const updateTagsInContent = (content: any): any => {
        if (Array.isArray(content)) {
          return content.map(updateTagsInContent);
        } else if (content && typeof content === "object") {
          if (content.type === "tag" && content.props?.tagId === args.tagId) {
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

    return args.tagId;
  },
});

export const deleteTag = mutation({
  args: {
    tagId: v.id("tags"),
  },
  handler: async (ctx, args) => {
    await verifyUserIdentity(ctx);

    const tag = await ctx.db.get(args.tagId);
    if (!tag) {
      throw new Error("Tag not found");
    }

    if (tag.type === "System") {
      throw new Error("System tags cannot be deleted");
    }

    await ctx.db.delete(args.tagId);

    return args.tagId;
  },
});
