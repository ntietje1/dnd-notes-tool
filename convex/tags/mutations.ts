import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireCampaignMembership } from "../campaigns/campaigns";
import { CATEGORY_KIND } from "./types";
import { CAMPAIGN_MEMBER_ROLE } from "../campaigns/types";
import { Id } from "../_generated/dataModel";
import { insertTagAndNote, insertTagCategory } from "./tags";

export const createTag = mutation({
  args: {
    name: v.string(),
    categoryId: v.id("tagCategories"),
    color: v.string(),
    description: v.optional(v.string()),
    campaignId: v.id("campaigns"),
  },
  handler: async (ctx, args): Promise<Id<"tags">> => {
    return await insertTagAndNote(ctx, {
      name: args.name,
      categoryId: args.categoryId,
      color: args.color,
      description: args.description,
      campaignId: args.campaignId,
    });
  },
});

export const updateTag = mutation({
  args: {
    tagId: v.id("tags"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"tags">> => {
    const tag = await ctx.db.get(args.tagId);
    if (!tag) {
      throw new Error("Tag not found");
    }

    const category = await ctx.db.get(tag.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    if (category.kind === CATEGORY_KIND.SystemManaged) {
      throw new Error("Managed-category tags cannot be updated");
    }

    await requireCampaignMembership(ctx, { campaignId: tag.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const updates: { name?: string; color?: string; description?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.color !== undefined) {
      updates.color = args.color;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
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
  handler: async (ctx, args): Promise<Id<"tags">> => {
    const tag = await ctx.db.get(args.tagId);
    if (!tag) {
      throw new Error("Tag not found");
    }

    const category = await ctx.db.get(tag.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    if (category.kind === CATEGORY_KIND.SystemManaged) {
      throw new Error("Managed-category tags cannot be deleted");
    }

    await requireCampaignMembership(ctx, { campaignId: tag.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    await ctx.db.delete(args.tagId);

    return args.tagId;
  },
});

export const createTagCategory = mutation({
  args: {
    campaignId: v.id("campaigns"),
    name: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"tagCategories">> => {
    await requireCampaignMembership(ctx, { campaignId: args.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    const existing = await ctx.db
      .query("tagCategories")
      .withIndex("by_campaign_kind_name", (q) =>
        q.eq("campaignId", args.campaignId).eq("kind", CATEGORY_KIND.User).eq("name", args.name.toLowerCase()),
      )
      .unique();

    if (existing) {
      throw new Error("Category already exists");
    }

    return await insertTagCategory(ctx, { campaignId: args.campaignId, kind: CATEGORY_KIND.User, name: args.name });
  },
});

export const updateTagCategory = mutation({
  args: {
    categoryId: v.id("tagCategories"),
    name: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"tagCategories">> => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");

    await requireCampaignMembership(ctx, { campaignId: category.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    if (category.kind !== CATEGORY_KIND.User) {
      throw new Error("Only user categories can be renamed");
    }

    await ctx.db.patch(args.categoryId, { name: args.name, updatedAt: Date.now() });
    return args.categoryId;
  },
});

export const deleteTagCategory = mutation({
  args: {
    categoryId: v.id("tagCategories"),
  },
  handler: async (ctx, args): Promise<Id<"tagCategories">> => {
    const category = await ctx.db.get(args.categoryId);
    if (!category) throw new Error("Category not found");

    await requireCampaignMembership(ctx, { campaignId: category.campaignId },
      { allowedRoles: [CAMPAIGN_MEMBER_ROLE.DM] }
    );

    if (category.kind !== CATEGORY_KIND.User) {
      throw new Error("Only user categories can be deleted");
    }

    // Optional: reassign or reject delete if there are tags under this category
    const tags = await ctx.db
      .query("tags")
      .withIndex("by_campaign_categoryId", (q) =>
        q.eq("campaignId", category.campaignId).eq("categoryId", args.categoryId),
      )
      .collect();
    if (tags.length > 0) {
      throw new Error("Cannot delete category with existing tags");
    }

    await ctx.db.delete(args.categoryId);
    return args.categoryId;
  },
});
