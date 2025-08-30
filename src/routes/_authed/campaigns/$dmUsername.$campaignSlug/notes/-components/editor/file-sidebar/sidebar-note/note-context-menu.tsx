import { FileEdit, Trash2 } from "~/lib/icons";
import {
  ContextMenu,
  type ContextMenuItem,
} from "~/components/context-menu/context-menu";

interface NoteContextMenuProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

export function NoteContextMenu({
  children,
  onEdit,
  onDelete,
}: NoteContextMenuProps) {
  const menuItems: ContextMenuItem[] = [
    {
      label: "Rename Page",
      icon: <FileEdit className="h-4 w-4" />,
      onClick: onEdit,
    },
    {
      label: "Delete Page",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      className: "text-red-600 focus:text-red-600",
    },
  ];

  return <ContextMenu items={menuItems}>{children}</ContextMenu>;
}
