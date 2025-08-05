import { DatabaseWriter, MutationCtx } from "../../_generated/server";
import { Tag } from "../../tags/types";
import { Id } from "../../_generated/dataModel";

export const insertTag = async (
  ctx: { db: DatabaseWriter },
  tag: Omit<Tag, "_id" | "_creationTime" | "updatedAt">,
) => {
  const tagId = await ctx.db.insert("tags", {
    name: tag.name,
    type: tag.type,
    color: tag.color,
    campaignId: tag.campaignId,
    updatedAt: Date.now(),
  });

  //TODO: add tag note page

  return tagId;
};

export const updateTagAndContent = async (
  ctx: MutationCtx,
  tagId: Id<"tags">,
  campaignId: Id<"campaigns">,
  currentName: string,
  currentColor: string,
  updates: {
    name?: string;
    color?: string;
  },
) => {
  const tagUpdates: {
    name?: string;
    color?: string;
    updatedAt: number;
  } = {
    updatedAt: Date.now(),
  };

  if (updates.name !== undefined) {
    tagUpdates.name = updates.name;
  }
  if (updates.color !== undefined) {
    tagUpdates.color = updates.color;
  }

  await ctx.db.patch(tagId, tagUpdates);

  if (updates.name !== undefined || updates.color !== undefined) {
    const newName = updates.name ?? currentName;
    const newColor = updates.color ?? currentColor;

    const allBlocks = await ctx.db
      .query("blocks")
      .withIndex("by_campaign_note_toplevel_pos", (q) =>
        q.eq("campaignId", campaignId),
      )
      .collect();

    const updateTagsInContent = (content: any): any => {
      if (Array.isArray(content)) {
        return content.map(updateTagsInContent);
      } else if (content && typeof content === "object") {
        if (content.type === "tag" && content.props?.tagId === tagId) {
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
};

export const deleteTagAndCleanupContent = async (
  ctx: MutationCtx,
  tagId: Id<"tags">,
) => {
  //TODO: modify all tags in content to just be text without being an actual tag inline content

  await ctx.db.delete(tagId);
};
