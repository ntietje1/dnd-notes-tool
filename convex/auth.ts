import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
});

// Helper function to get base user ID from OAuth subject
export const getBaseUserId = (subject: string) => subject.split("|")[0];
