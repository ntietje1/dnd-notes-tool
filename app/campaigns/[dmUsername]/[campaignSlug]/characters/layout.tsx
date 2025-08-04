"use client";

import { ReactNode } from "react";
import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Campaign } from "@/convex/campaigns/types";
import { createContext, useContext } from "react";

interface CharactersLayoutProps {
  children: ReactNode;
  params: Promise<{
    dmUsername: string;
    campaignSlug: string;
  }>;
}

type CharactersContextType = {
  currentCampaign: Campaign | null | undefined;
  isLoading: boolean;
};

const CharactersContext = createContext<CharactersContextType | null>(null);

function CharactersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full bg-slate-50">
      {children}
    </div>
  );
}

export function CharactersProvider({
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

  const value: CharactersContextType = {
    currentCampaign,
    isLoading,
  };

  return (
    <CharactersContext.Provider value={value}>
      <CharactersLayout>{children}</CharactersLayout>
    </CharactersContext.Provider>
  );
}

export const useCharacters = () => {
  const context = useContext(CharactersContext);
  if (!context) {
    throw new Error("useCharacters must be used within a CharactersProvider");
  }
  return context;
};

export default function CharactersSectionLayout({
  children,
  params,
}: CharactersLayoutProps) {
  const { dmUsername, campaignSlug } = React.use(params);

  return (
    <CharactersProvider dmUsername={dmUsername} campaignSlug={campaignSlug}>
      {children}
    </CharactersProvider>
  );
} 