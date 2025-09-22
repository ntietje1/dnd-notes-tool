import { CategoryContextMenu, type CategoryContextMenuProps } from "../generic-category-folder/category-context-menu";
import { Plus, MapPin } from "~/lib/icons";
import { useCampaign } from "~/contexts/CampaignContext";
import { useRouter } from "@tanstack/react-router";
import LocationDialog from "~/components/forms/category-tag-dialogs/location-tag-dialog/location-dialog";
import { forwardRef, useState } from "react";
import type { ContextMenuItem, ContextMenuRef } from "~/components/context-menu/context-menu";
import { useFolderState } from "~/hooks/useFolderState";
import { LOCATION_CONFIG } from "~/components/forms/category-tag-dialogs/location-tag-dialog/types";

export const LocationCategoryFolderContextMenu = forwardRef<ContextMenuRef, CategoryContextMenuProps>(({
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
  };

  const menuItems: ContextMenuItem[] = [
    {
      type: "action",
      icon: <Plus className="h-4 w-4" />,
      label: `Create New ${categoryConfig.singular}`,
      onClick: handleCreateItem,
    },
    {
      type: "action",
      icon: <MapPin className="h-4 w-4" />,
      label: `Go to ${categoryConfig.plural}`,
      onClick: () => {
        router.navigate({
          to: "/campaigns/$dmUsername/$campaignSlug/locations",
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
        categoryConfig={LOCATION_CONFIG}
        itemsTransformation={() => menuItems}
      >
        {children}
      </CategoryContextMenu>
      <LocationDialog
        mode="create"
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        config={LOCATION_CONFIG}
        navigateToNote={true}
      />
    </>
  );
});
