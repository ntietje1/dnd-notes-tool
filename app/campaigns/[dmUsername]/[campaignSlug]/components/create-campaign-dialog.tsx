"use client";

import React, { useState, useEffect } from "react";
import { CampaignDialog } from "./campaign-dialog";

export default function CreateCampaignDialog() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Listen for custom events to open the dialog
  useEffect(() => {
    const handleOpenDialog = () => {
      setIsCreateModalOpen(true);
    };

    window.addEventListener("openCreateCampaign", handleOpenDialog);
    return () => {
      window.removeEventListener("openCreateCampaign", handleOpenDialog);
    };
  }, []);

  return (
    <CampaignDialog
      mode="create"
      isOpen={isCreateModalOpen}
      onClose={() => setIsCreateModalOpen(false)}
    />
  );
}
