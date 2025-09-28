import {
    ContextMenu,
    type ContextMenuItem,
    type ContextMenuRef,
  } from "~/components/context-menu/context-menu";
  import { useState, forwardRef, useMemo } from "react";
import { Plus } from "~/lib/icons";
import { useFolderState } from "~/hooks/useFolderState";
import type { TagCategoryConfig } from "~/components/forms/category-tag-dialogs/base-tag-dialog/types";
import GenericTagDialog from "~/components/forms/category-tag-dialogs/generic-tag-dialog/generic-dialog";

export interface CategoryContextMenuProps {
  children: React.ReactNode;
  categoryConfig: TagCategoryConfig;
  itemsTransformation?: (baseItems: ContextMenuItem[]) => ContextMenuItem[];
}

export const CategoryContextMenu = forwardRef<ContextMenuRef, CategoryContextMenuProps>(({
  children,
  categoryConfig,
  itemsTransformation = (baseItems) => baseItems,
}, ref) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { openFolder } = useFolderState(categoryConfig.categoryName);

  const handleCreateItem = () => {
    openFolder();
    setIsCreateDialogOpen(true);
  };

  const baseMenuItems: ContextMenuItem[] = [
    {
      type: "action",
      icon: <Plus className="h-4 w-4" />,
      label: `Create New ${categoryConfig.singular}`,
      onClick: handleCreateItem,
    },
  ];

  const menuItems = useMemo(() => itemsTransformation(baseMenuItems), [itemsTransformation, baseMenuItems]);

  return (
    <>
      <ContextMenu ref={ref} items={menuItems} menuClassName="w-64">
        {children}
      </ContextMenu>

      <GenericTagDialog
        mode="create"
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        config={categoryConfig}
      />
    </>
  );
});
  