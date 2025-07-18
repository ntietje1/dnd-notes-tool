import { query } from "../_generated/server";
import { getBaseUserId } from "../auth";

export const getCurrentEditor = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = getBaseUserId(identity.subject);
    const editor = await ctx.db
      .query("editor")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return editor;
  },
});
