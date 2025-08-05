"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  ContextMenu,
  type ContextMenuItem,
} from "@/components/context-menu/context-menu";
import { LocationDialog } from "@/app/campaigns/[dmUsername]/[campaignSlug]/locations/components/location-dialog";
import { useNotes } from "@/contexts/NotesContext";

interface LocationSystemFolderContextMenuProps {
  children: React.ReactNode;
}

export function LocationSystemFolderContextMenu({
  children,
}: LocationSystemFolderContextMenuProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { currentCampaign } = useNotes();

  const handleCreateLocation = () => {
    setIsCreateDialogOpen(true);
  };

  const menuItems: ContextMenuItem[] = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: "Create New Location",
      onClick: handleCreateLocation,
    },
  ];

  return (
    <>
      <ContextMenu items={menuItems}>{children}</ContextMenu>
      
      {currentCampaign?._id && (
      <LocationDialog
        mode="create"
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        campaignId={currentCampaign._id}
            navigateToNote={true}
        />
      )}
    </>
  );
}