import { v } from "convex/values";
import { NoteTag, Tag } from "./types";
import { query } from "../_generated/server";

export const getTags = query({
  args: {
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args): Promise<Tag[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!args.campaignId) {
      return [];
    }

    const tags = await ctx.db
      .query("tags")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
      .collect();

    return tags;
  },
});

export const getNoteTags = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args): Promise<NoteTag[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const noteTags = await ctx.db
      .query("noteTags")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    return noteTags;
  },
});
