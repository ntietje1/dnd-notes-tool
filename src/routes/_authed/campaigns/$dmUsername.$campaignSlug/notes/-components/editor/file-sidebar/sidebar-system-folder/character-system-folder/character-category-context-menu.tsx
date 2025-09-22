import CharacterDialog from "~/components/forms/category-tag-dialogs/character-tag-dialog/character-dialog";
import { CategoryContextMenu, type CategoryContextMenuProps } from "../generic-category-folder/category-context-menu";
import { User, Plus } from "~/lib/icons";
import { useCampaign } from "~/contexts/CampaignContext";
import { useRouter } from "@tanstack/react-router";
import { forwardRef, useState } from "react";
import type { ContextMenuItem, ContextMenuRef } from "~/components/context-menu/context-menu";
import { useFolderState } from "~/hooks/useFolderState";
import { CHARACTER_CONFIG } from "~/components/forms/category-tag-dialogs/character-tag-dialog/types";

export const CharacterCategoryFolderContextMenu = forwardRef<ContextMenuRef, CategoryContextMenuProps>(({
  categoryConfig,
  children,
}, ref) => {
  const router = useRouter();
  const { dmUsername, campaignSlug } = useCampaign();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { openFolder } = useFolderState(categoryConfig.categoryName);

  const handleCreateItem = () => {
    openFolder();
    setIsCreateDialogOpen(true);
  }

  const menuItems: ContextMenuItem[] = [
    {
      type: "action",
      icon: <Plus className="h-4 w-4" />,
      label: `Create New ${categoryConfig.singular}`,
      onClick: handleCreateItem,
    },
    {
      type: "action",
      icon: <User className="h-4 w-4" />,
      label: `Go to ${categoryConfig.plural}`,
      onClick: () => {
        router.navigate({
          to: "/campaigns/$dmUsername/$campaignSlug/characters",
          params: {
            dmUsername,
            campaignSlug,
          },
        });
      },
    }
  ];

  
  return (
    <>
      <CategoryContextMenu
        ref={ref}
        categoryConfig={CHARACTER_CONFIG}
        itemsTransformation={() => menuItems}
      >
        {children}
      </CategoryContextMenu>
      <CharacterDialog
        mode="create"
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        config={CHARACTER_CONFIG}
        navigateToNote={false}
      />
    </>
  );
});
