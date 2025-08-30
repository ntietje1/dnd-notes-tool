import {
  ContextMenu,
  type ContextMenuItem,
} from "~/components/context-menu/context-menu";
import { Plus } from "~/lib/icons";
import { useState } from "react";
import CharacterDialog from "~/routes/_authed/campaigns/$dmUsername.$campaignSlug/characters/-components/character-dialog";
import { useCampaign } from "~/contexts/CampaignContext";

interface CharacterSystemFolderContextMenuProps {
  children: React.ReactNode;
}

export function CharacterSystemFolderContextMenu({
  children,
}: CharacterSystemFolderContextMenuProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { campaignSlug, dmUsername } = useCampaign();

  const handleCreateCharacter = () => {
    setIsCreateDialogOpen(true);
  };

  const menuItems: ContextMenuItem[] = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: "Create New Character",
      onClick: handleCreateCharacter,
    },
  ];

  return (
    <>
      <ContextMenu items={menuItems} menuClassName="w-64">
        {children}
      </ContextMenu>

      {dmUsername && campaignSlug && (
        <CharacterDialog
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
