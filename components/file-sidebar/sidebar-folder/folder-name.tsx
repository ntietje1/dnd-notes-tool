"use client";

import { useRef, useState, useEffect } from "react";
import { UNTITLED_FOLDER_NAME } from "@/convex/types";

interface FolderNameProps {
  folder: any;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (name: string) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

export function FolderName({
  folder,
  isEditing,
  onEdit,
  onSave,
  onContextMenu,
}: FolderNameProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(folder.name || UNTITLED_FOLDER_NAME);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          onEdit();
        }}
        onBlur={() => onSave(name)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSave(name);
          } else if (e.key === "Escape") {
            setName(folder.name || UNTITLED_FOLDER_NAME);
            onSave(folder.name || UNTITLED_FOLDER_NAME);
          }
          // Prevent space from triggering button click
          if (e.key === " ") {
            e.stopPropagation();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="bg-transparent border-none w-full focus:outline-none focus:ring-0 text-sm"
      />
    );
  }

  return (
    <span className="truncate" onContextMenu={onContextMenu}>
      {folder.name || UNTITLED_FOLDER_NAME}
    </span>
  );
}
