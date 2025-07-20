"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const userProfile = useQuery(api.users.queries.getUserProfile);

  useEffect(() => {
    // Only handle onboarding logic for authenticated users
    if (isAuthenticated && !isLoading && userProfile !== undefined) {
      const isOnboardingPage = pathname === "/onboarding";
      const needsOnboarding = !userProfile?.isOnboarded;

      if (needsOnboarding && !isOnboardingPage) {
        // User needs onboarding but is not on onboarding page
        router.replace("/onboarding");
      } else if (!needsOnboarding && isOnboardingPage) {
        // User is already onboarded but on onboarding page
        router.replace("/campaigns");
      }
    }
  }, [isAuthenticated, isLoading, userProfile, pathname, router]);

  // Show loading state while checking authentication and profile
  if (isLoading || (isAuthenticated && userProfile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user is not authenticated, show children (let middleware handle auth)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // If user is authenticated but needs onboarding and not on onboarding page, show loading
  if (isAuthenticated && userProfile && !userProfile.isOnboarded && pathname !== "/onboarding") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show children for all other cases
  return <>{children}</>;
} 