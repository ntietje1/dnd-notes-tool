import { Auth, UserIdentity } from "convex/server";

export const getBaseUserId = (subject: string) => {
  if (!subject) {
    throw new Error("Invalid subject: must be a non-empty string");
  }
  const parts = subject.split("|");
  if (parts.length === 0 || !parts[0]) {
    throw new Error("Invalid subject format: unable to extract base user ID");
  }
  return parts[0];
};

export async function verifyUserIdentity(ctx: {
  auth: Auth;
}): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}
