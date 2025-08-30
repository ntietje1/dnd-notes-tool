import { EditableName } from "../sidebar-item/editable-name";
import { UNTITLED_FOLDER_NAME } from "convex/notes/types";
import type { FolderNode } from "convex/notes/types";

interface FolderNameProps {
  folder: FolderNode;
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
