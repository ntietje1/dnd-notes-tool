"use client";

import { EditableName } from "@/app/notes/editor/file-sidebar/editable-name";
import { UNTITLED_FOLDER_NAME } from "@/convex/notes/types";
import { Folder } from "@/convex/notes/types";

interface FolderNameProps {
  folder: Folder;
  isRenaming: boolean;
  onFinishRename: (name: string) => void;
}

export function FolderName({
  folder,
  isRenaming,
  onFinishRename,
}: FolderNameProps) {
  return (
    <EditableName
      initialName={folder.name || ""}
      defaultName={UNTITLED_FOLDER_NAME}
      isRenaming={isRenaming}
      onFinishRename={onFinishRename}
    />
  );
}
