import { ContextMenu, type ContextMenuItem } from "~/components/context-menu/context-menu";
import { FilePlus, FolderPlus, FolderEdit, Trash2 } from "~/lib/icons";

interface FolderContextMenuProps {
  children: React.ReactNode;
  onRename: () => void;
  onDelete: () => void;
  onNewPage: () => void;
  onNewFolder: () => void;
}

export function FolderContextMenu({
  children,
  onRename,
  onDelete,
  onNewPage,
  onNewFolder,
}: FolderContextMenuProps) {
  const menuItems: ContextMenuItem[] = [
    {
      label: "Rename Folder",
      icon: <FolderEdit className="h-4 w-4" />,
      onClick: onRename,
    },
    {
      label: "New Page",
      icon: <FilePlus className="h-4 w-4" />,
      onClick: onNewPage,
    },
    {
      label: "New Folder",
      icon: <FolderPlus className="h-4 w-4" />,
      onClick: onNewFolder,
    },
    {
      label: "Delete Folder",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      className: "text-red-600 focus:text-red-600",
    },
  ];

  return <ContextMenu items={menuItems}>{children}</ContextMenu>;
}
