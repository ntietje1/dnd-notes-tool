"use client";

import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolderName } from "./folder-name";
import { FolderContextMenu } from "./folder-context-menu";

interface FolderButtonProps {
  folder: any;
  isExpanded: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onSave: (name: string) => void;
  onDelete: () => void;
}

export function FolderButton({
  folder,
  isExpanded,
  isEditing,
  onToggle,
  onEdit,
  onSave,
  onDelete,
}: FolderButtonProps) {
  return (
    <div className="flex w-full min-w-0">
      <FolderContextMenu onEdit={onEdit} onDelete={onDelete}>
        <Button
          variant="ghost"
          className="flex-1 justify-start gap-2 h-9 px-2 min-w-0"
          onClick={onToggle}
        >
          <div className="flex items-center gap-2 min-w-0 w-full">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            <Folder className="h-4 w-4 shrink-0" />
            <FolderName
              folder={folder}
              isEditing={isEditing}
              onEdit={onEdit}
              onSave={onSave}
            />
          </div>
        </Button>
      </FolderContextMenu>
    </div>
  );
}
