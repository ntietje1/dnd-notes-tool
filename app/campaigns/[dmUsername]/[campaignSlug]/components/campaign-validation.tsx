"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

interface CampaignValidationProps {
  dmUsername: string;
  campaignSlug: string;
  children: ReactNode;
}

export function CampaignValidation({
  dmUsername,
  campaignSlug,
  children,
}: CampaignValidationProps) {
  const campaign = useQuery(api.campaigns.queries.getCampaignBySlug, {
    dmUsername,
    slug: campaignSlug,
  });

  // If campaign query has resolved and returned null, trigger not-found
  if (campaign === null) {
    notFound();
  }

  // If still loading, show children (let the page handle loading state)
  if (campaign === undefined) {
    return <>{children}</>;
  }

  // Campaign is valid, render children
  return <>{children}</>;
}
