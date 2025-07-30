"use client";

import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { SignInCard } from "./SignInCard";
import { api } from "@/convex/_generated/api";
import { LoadingSpinner } from "@/components/loading/loading-spinner";
import React from "react";

export function SignInWrapper() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  // Only query user profile if authenticated
  const userProfile = useQuery(
    api.users.queries.getUserProfile,
    isAuthenticated ? {} : "skip",
  );

  // Show loading spinner while checking authentication and profile
  if (isAuthenticated && userProfile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 bg-white rounded-lg shadow-lg px-6 py-4">
          <LoadingSpinner size="md" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <SignInCard />;
}
