import { Auth, UserIdentity } from "convex/server";

export const getBaseUserId = (subject: string) => subject.split("|")[0];

export async function verifyUserIdentity(ctx: {
  auth: Auth;
}): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}
