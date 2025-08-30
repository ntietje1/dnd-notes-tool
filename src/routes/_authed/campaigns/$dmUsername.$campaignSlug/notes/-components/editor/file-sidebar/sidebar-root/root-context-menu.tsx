import { FilePlus, FolderPlus } from "~/lib/icons";
import {
  ContextMenu,
  type ContextMenuItem,
} from "~/components/context-menu/context-menu";

interface RootContextMenuProps {
  children: React.ReactNode;
  onNewPage: () => void;
  onNewFolder: () => void;
  className?: string;
}

export function RootContextMenu({
  children,
  onNewPage,
  onNewFolder,
  className,
}: RootContextMenuProps) {
  const menuItems: ContextMenuItem[] = [
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
  ];

  return (
    <ContextMenu items={menuItems} className={className}>
      {children}
    </ContextMenu>
  );
}
