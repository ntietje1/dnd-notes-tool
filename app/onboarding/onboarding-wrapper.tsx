"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export function OnboardingWrapper() {
  const userProfile = useQuery(api.users.queries.getUserProfile);

  // Redirect if user is already onboarded
  if (userProfile?.isOnboarded) {
    redirect("/campaigns");
  }

  return <OnboardingForm />;
}
