// import { Doc } from "./_generated/dataModel";
// import { mutation } from "./_generated/server";
// import { v } from "convex/values";

// export const createCampaign = mutation({
//     args: {
//       name: v.string(),
//       description: v.optional(v.string()),
//       link: v.string(),
//     },
//     handler: async (ctx, args) => {
//       const identity = await ctx.auth.getUserIdentity();
//       if (!identity) {
//         throw new Error("Not authenticated");
//       }

//       const now = Date.now();
//       const updates: Partial<Doc<"campaigns">> = {
//         updatedAt: now,
//       };

//       await ctx.db.insert("campaigns", {
//         name: args.name,
//     },
//   });
