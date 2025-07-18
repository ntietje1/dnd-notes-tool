import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getBaseUserId } from "../auth";

export const setCurrentEditor = mutation({
  args: {
    noteId: v.optional(v.id("notes")),
    campaignId: v.optional(v.id("campaigns")),
    sortOrder: v.optional(
      v.union(
        v.literal("alphabetical"),
        v.literal("dateCreated"),
        v.literal("dateModified"),
      ),
    ),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const baseUserId = getBaseUserId(identity.subject);

    const editor = await ctx.db
      .query("editor")
      .withIndex("by_user", (q) => q.eq("userId", baseUserId))
      .unique();

    if (!editor) {
      return ctx.db.insert("editor", {
        userId: baseUserId,
        activeNoteId: args.noteId,
        campaignId: args.campaignId!,
        sortOrder: args.sortOrder ?? "alphabetical",
        sortDirection: args.sortDirection ?? "asc",
      });
    }

    return ctx.db.patch(editor._id, {
      ...(args.noteId !== undefined && { activeNoteId: args.noteId }),
      ...(args.campaignId !== undefined && { campaignId: args.campaignId }),
      ...(args.sortOrder !== undefined && { sortOrder: args.sortOrder }),
      ...(args.sortDirection !== undefined && {
        sortDirection: args.sortDirection,
      }),
    });
  },
});
