import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper function to check if content has shared nodes
function hasSharedNodes(content: any): boolean {
  if (!content) return false;

  // Check if the current node is shared
  if (content.attrs?.shared === true) {
    return true;
  }

  // Recursively check content array
  if (Array.isArray(content.content)) {
    return content.content.some(hasSharedNodes);
  }

  return false;
}

// Helper function to extract shared blocks
function extractSharedBlocks(content: any): any[] {
  if (!content) return [];

  const sharedBlocks: any[] = [];

  if (content.attrs?.shared === true) {
    sharedBlocks.push(content);
  }

  if (Array.isArray(content.content)) {
    content.content.forEach((node: any) => {
      sharedBlocks.push(...extractSharedBlocks(node));
    });
  }

  return sharedBlocks;
}

// Query to get notes with shared content
export const getNotesWithSharedContent = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("notes")
      .withIndex("by_shared", (q) =>
        q.eq("hasSharedContent", true).eq("userId", identity.subject),
      )
      .collect();
  },
});

// Query to get specific shared blocks from a note
export const getSharedBlocks = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== identity.subject) {
      throw new Error("Note not found or access denied");
    }

    return extractSharedBlocks(note.content);
  },
});

// Export helper function to be used in other mutations
export function checkForSharedContent(content: any): boolean {
  return hasSharedNodes(content);
}
