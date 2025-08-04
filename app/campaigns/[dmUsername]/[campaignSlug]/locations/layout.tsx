"use client";

import { ReactNode } from "react";
import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Campaign } from "@/convex/campaigns/types";
import { createContext, useContext } from "react";

interface LocationsLayoutProps {
  children: ReactNode;
  params: Promise<{
    dmUsername: string;
    campaignSlug: string;
  }>;
}

type LocationsContextType = {
  currentCampaign: Campaign | null | undefined;
  isLoading: boolean;
};

const LocationsContext = createContext<LocationsContextType | null>(null);

function LocationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full bg-slate-50">
      {children}
    </div>
  );
}

export function LocationsProvider({
  dmUsername,
  campaignSlug,
  children,
}: {
  dmUsername: string;
  campaignSlug: string;
  children: ReactNode;
}) {
  const currentCampaign = useQuery(api.campaigns.queries.getCampaignBySlug, {
    dmUsername,
    slug: campaignSlug,
  });

  const isLoading = currentCampaign === undefined;

  const value: LocationsContextType = {
    currentCampaign,
    isLoading,
  };

  return (
    <LocationsContext.Provider value={value}>
      <LocationsLayout>{children}</LocationsLayout>
    </LocationsContext.Provider>
  );
}

export const useLocations = () => {
  const context = useContext(LocationsContext);
  if (!context) {
    throw new Error("useLocations must be used within a LocationsProvider");
  }
  return context;
};

export default function LocationsSectionLayout({
  children,
  params,
}: LocationsLayoutProps) {
  const { dmUsername, campaignSlug } = React.use(params);

  return (
    <LocationsProvider dmUsername={dmUsername} campaignSlug={campaignSlug}>
      {children}
    </LocationsProvider>
  );
} 