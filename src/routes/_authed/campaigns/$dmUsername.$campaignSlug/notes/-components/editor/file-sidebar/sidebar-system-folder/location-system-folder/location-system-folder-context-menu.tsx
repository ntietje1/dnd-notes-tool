import { Plus } from "~/lib/icons";
import {
  ContextMenu,
  type ContextMenuItem,
} from "~/components/context-menu/context-menu";
import { useNotes } from "~/contexts/NotesContext";
import { useState } from "react";
import LocationDialog from "~/routes/_authed/campaigns/$dmUsername.$campaignSlug/locations/-components/location-dialog";
import { useCampaign } from "~/contexts/CampaignContext";

interface LocationSystemFolderContextMenuProps {
  children: React.ReactNode;
}

export function LocationSystemFolderContextMenu({
  children,
}: LocationSystemFolderContextMenuProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { campaignSlug, dmUsername } = useCampaign();

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

      {dmUsername && campaignSlug && (
        <LocationDialog
          mode="create"
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          dmUsername={dmUsername}
          campaignSlug={campaignSlug}
          navigateToNote={true}
        />
      )}
    </>
  );
}
