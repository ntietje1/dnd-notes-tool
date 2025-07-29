"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { GitHubLogo } from "@/components/GitHubLogo";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export function SignInWithGitHub() {
  const { signIn } = useAuthActions();
  const userProfile = useQuery(api.users.queries.getUserProfile);

  const handleSignIn = () => {
    void signIn("github", {
      redirectTo:
        userProfile && userProfile.isOnboarded ? "/campaigns" : "/onboarding",
    });
  };

  return (
    <Button
      className="flex-1"
      variant="outline"
      type="button"
      onClick={handleSignIn}
    >
      <GitHubLogo className="mr-2 h-4 w-4" /> GitHub
    </Button>
  );
}
