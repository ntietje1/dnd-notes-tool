"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";

export function OnboardingHandler() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const pathname = usePathname();

  const userProfile = useQuery(
    api.users.queries.getUserProfile,
    isAuthenticated ? {} : "skip",
  );

  useEffect(() => {
    if (
      !isAuthenticated ||
      userProfile === undefined ||
      ["/", "/signin"].includes(pathname)
    )
      return;

    const isOnboardingPage = pathname === "/onboarding";
    const isOnboarded = userProfile?.isOnboarded;

    if (isOnboarded && isOnboardingPage) {
      router.replace("/campaigns");
    } else if (!isOnboarded && !isOnboardingPage) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, userProfile, pathname, router]);

  return null;
}
