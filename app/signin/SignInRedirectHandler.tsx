"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LoadingPage } from "@/components/loading/loading-page";

export function SignInRedirectHandler() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  const userProfile = useQuery(
    api.users.queries.getUserProfile,
    isAuthenticated ? {} : "skip",
  );

  useEffect(() => {
    if (!isAuthenticated || isLoading || userProfile === undefined) {
      return;
    }

    const targetPath = userProfile?.isOnboarded ? "/campaigns" : "/onboarding";
    router.replace(targetPath);
  }, [isAuthenticated, isLoading, userProfile, router]);

  if (isLoading) {
    return <LoadingPage message="Loading..." />;
  }

  if (isAuthenticated) {
    return <LoadingPage message="Redirecting..." />;
  }

  return null;
}
