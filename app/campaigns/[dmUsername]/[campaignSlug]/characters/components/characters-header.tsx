"use client";

import { useCharacters } from "../layout";
import { PageHeader } from "@/components/ui/content-grid-page/page-header";

export default function CharactersHeader() {
  const { currentCampaign } = useCharacters();

  if (!currentCampaign) {
    return null;
  }

  return (
    <PageHeader
      title="Characters"
      description="Manage characters for your campaign. Each character automatically creates a tag that can be used in your notes."
    />
  );
} 