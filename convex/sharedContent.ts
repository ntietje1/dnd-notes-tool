import { query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get base user ID from OAuth subject (keep in sync with notes.ts)
const getBaseUserId = (subject: string) => subject.split("|")[0];

// Function to check if content has shared blocks
export function checkForSharedContent(content: any): boolean {
  if (!content) return false;

  // Check if the current node is shared
  if (content.attrs?.shared === true) {
    return true;
  }

  // Recursively check content array
  if (Array.isArray(content.content)) {
    return content.content.some(checkForSharedContent);
  }

  return false;
}

// Function to extract shared blocks from content
export function extractSharedBlocks(content: any): any[] {
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

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_shared", (q) =>
        q.eq("hasSharedContent", true).eq("userId", identity.subject),
      )
      .collect();

    // Filter notes to match base user ID
    const baseUserId = getBaseUserId(identity.subject);
    return notes.filter((note) => getBaseUserId(note.userId) === baseUserId);
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
    if (
      !note ||
      getBaseUserId(note.userId) !== getBaseUserId(identity.subject)
    ) {
      throw new Error("Note not found or access denied");
    }

    return extractSharedBlocks(note.content);
  },
});
