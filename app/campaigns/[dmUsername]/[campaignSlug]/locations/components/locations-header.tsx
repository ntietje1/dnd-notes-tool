"use client";

import { PageHeader } from "@/components/ui/content-grid-page/page-header";
import { useLocations } from "../layout";

export default function LocationsHeader() {
  const { currentCampaign } = useLocations();

  if (!currentCampaign) {
    return null;
  }

  return (
    <PageHeader
      title="Locations"
      description="Manage locations for your campaign. Each location automatically creates a tag that can be used in your notes."
    />
  );
} 