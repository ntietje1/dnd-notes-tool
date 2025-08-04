"use client";

import { CreateActionCard } from "@/components/ui/content-grid-page/create-action-card";
import { Sword } from "lucide-react";

export function CreateCampaignCard() {
  const handleClick = () => {
    // This will be handled by the CreateCampaignDialog component
    const event = new CustomEvent("openCreateCampaign");
    window.dispatchEvent(event);
  };

  return (
    <CreateActionCard
      onClick={handleClick}
      title="Create New Campaign"
      description="Start a new adventure with your party"
      icon={Sword}
      minHeight="h-64"
    />
  );
}
