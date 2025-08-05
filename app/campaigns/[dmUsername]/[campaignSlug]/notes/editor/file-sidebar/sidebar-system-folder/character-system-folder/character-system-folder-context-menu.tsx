"use client";

import { useState } from "react";
import {
  ContextMenu,
  type ContextMenuItem,
} from "@/components/context-menu/context-menu";
import { CharacterDialog } from "@/app/campaigns/[dmUsername]/[campaignSlug]/characters/components/character-dialog";
import { useNotes } from "@/contexts/NotesContext";
import { Plus } from "lucide-react";

interface CharacterSystemFolderContextMenuProps {
  children: React.ReactNode;
}

export function CharacterSystemFolderContextMenu({
  children,
}: CharacterSystemFolderContextMenuProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { currentCampaign } = useNotes();

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
      <ContextMenu items={menuItems} menuClassName="w-64">{children}</ContextMenu>
      
      {currentCampaign?._id && (
        <CharacterDialog
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