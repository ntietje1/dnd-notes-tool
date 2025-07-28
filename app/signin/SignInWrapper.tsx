"use client";

import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import { SignInCard } from "./SignInCard";

export function SignInWrapper() {
  const { isAuthenticated } = useConvexAuth();

  if (isAuthenticated) {
    redirect("/onboarding");
  }

  return <SignInCard />;
}
