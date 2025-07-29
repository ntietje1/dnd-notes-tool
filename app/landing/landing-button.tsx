"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

export function LandingPageButton() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const userProfile = useQuery(api.users.queries.getUserProfile);

  if (isLoading || userProfile === undefined) {
    return (
      <Button size="lg" className="text-lg px-8 min-w-32" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        size="lg"
        className="text-lg px-8 min-w-32"
        onClick={() => router.push("/signin")}
      >
        Get Started
      </Button>
    );
  } else {
    const targetPath =
      userProfile && userProfile.isOnboarded ? "/campaigns" : "/onboarding";

    return (
      <Button
        size="lg"
        className="text-lg px-8 min-w-32"
        onClick={() => router.push(targetPath)}
      >
        Continue
      </Button>
    );
  }
}
