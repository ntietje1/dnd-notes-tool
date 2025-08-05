"use client";

import { FileText, Pencil, Trash2 } from "lucide-react";
import {
  ContextMenu,
  type ContextMenuItem,
} from "@/components/context-menu/context-menu";

interface SystemFolderContextMenuProps {
  children: React.ReactNode;
}

export function SystemFolderContextMenu({
  children,
}: SystemFolderContextMenuProps) {
  const menuItems: ContextMenuItem[] = [
    // {
    //   label: "Rename",
    //   icon: <Pencil className="h-4 w-4" />,
    //   onClick: onRename,
    // },
    // {
    //   label: "New Page",
    //   icon: <FileText className="h-4 w-4" />,
    //   onClick: onNewPage,
    // },
    // {
    //   label: "Delete",
    //   icon: <Trash2 className="h-4 w-4" />,
    //   onClick: onDelete,
    //   className: "text-red-600 focus:text-red-600",
    // },
  ];

  return <ContextMenu items={menuItems}>{children}</ContextMenu>;
}
