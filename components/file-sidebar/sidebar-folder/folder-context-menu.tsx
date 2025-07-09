"use client";

import { useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2 } from "lucide-react";

interface FolderContextMenuProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

export function FolderContextMenu({
  children,
  onEdit,
  onDelete,
}: FolderContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      // Position relative to click point with small offset
      setPosition({
        x: e.clientX + (rect.left - rect.right / 2),
        y: e.clientY - rect.top - rect.height,
      });
    }
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    // Only allow opening via right click
    if (!open || isOpen) {
      setIsOpen(open);
    }
  };

  const handleRename = () => {
    onEdit();
    // Slight delay fixes focus issues
    setTimeout(() => setIsOpen(false), 0);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger
        ref={triggerRef}
        className="relative"
        asChild
        onContextMenu={handleContextMenu}
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48"
        style={{
          position: "absolute",
          top: position.y,
          left: position.x,
        }}
        sideOffset={0}
        alignOffset={0}
      >
        <DropdownMenuItem onClick={handleRename}>
          <Pencil className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
