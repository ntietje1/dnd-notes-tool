"use client";

import { useEffect, Suspense, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { LoadingSpinner } from "@/components/loading/loading-spinner";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasHandledRedirect, setHasHandledRedirect] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Only query user profile if authenticated
  const userProfile = useQuery(
    api.users.queries.getUserProfile,
    isAuthenticated ? {} : "skip",
  );

  const handleRedirect = useCallback(
    async (targetPath: string) => {
      setIsRedirecting(true);
      await router.replace(targetPath);
      setHasHandledRedirect(true);
      setIsRedirecting(false);
    },
    [router],
  );

  useEffect(() => {
    // Only handle onboarding logic for authenticated users
    if (
      isAuthenticated &&
      userProfile !== undefined &&
      !hasHandledRedirect &&
      !isRedirecting
    ) {
      const isOnboardingPage = pathname === "/onboarding";
      const needsOnboarding = !userProfile?.isOnboarded;

      if (needsOnboarding && !isOnboardingPage) {
        // User needs onboarding but is not on onboarding page
        handleRedirect("/onboarding");
      } else if (!needsOnboarding && isOnboardingPage) {
        // User is already onboarded but on onboarding page
        handleRedirect("/campaigns");
      } else {
        setHasHandledRedirect(true);
      }
    }
  }, [
    isAuthenticated,
    userProfile,
    pathname,
    hasHandledRedirect,
    isRedirecting,
    handleRedirect,
  ]);

  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white rounded-lg shadow-lg px-6 py-4">
          <LoadingSpinner size="md" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { isAuthenticated } = useConvexAuth();

  return (
    <>
      {children}

      {isAuthenticated && (
        <Suspense fallback={null}>
          <AuthenticatedContent>{null}</AuthenticatedContent>
        </Suspense>
      )}
    </>
  );
}
