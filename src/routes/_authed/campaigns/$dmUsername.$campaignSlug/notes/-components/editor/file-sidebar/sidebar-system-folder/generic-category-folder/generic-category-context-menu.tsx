import {
    ContextMenu,
    type ContextMenuItem,
  } from "~/components/context-menu/context-menu";
  import { useState } from "react";
import { GenericTagCreateDialog } from "./generic-tag-create-dialog";
import { Plus } from "~/lib/icons";

export interface GenericCategoryContextMenuProps {
  children: React.ReactNode;
  categoryName: string;
  renderCreateDialog?: (isOpen: boolean, onClose: () => void) => React.ReactNode;
  additionalItems?: (args: { categoryName: string, baseMenuItems: ContextMenuItem[] }) => ContextMenuItem[];
}

export function GenericCategoryContextMenu({
  children,
  categoryName,
  renderCreateDialog,
  additionalItems,
}: GenericCategoryContextMenuProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateItem = () => {
    setIsCreateDialogOpen(true);
  };

  const baseMenuItems: ContextMenuItem[] = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: `Create New ${categoryName}`,
      onClick: handleCreateItem,
    },
  ];

  const menuItems = additionalItems
    ? [...baseMenuItems, ...additionalItems({ categoryName, baseMenuItems })]
    : baseMenuItems;

  return (
    <>
      <ContextMenu items={menuItems} menuClassName="w-64">
        {children}
      </ContextMenu>

      {renderCreateDialog ? (
        renderCreateDialog(isCreateDialogOpen, () => setIsCreateDialogOpen(false))
      ) : (
        <GenericTagCreateDialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} navigateToNote={true} />
      )}
    </>
  );
}
  