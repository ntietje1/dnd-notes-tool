import { EditableName } from "../sidebar-item/editable-name";
import { UNTITLED_FOLDER_NAME } from "convex/notes/types";
import type { Folder } from "convex/notes/types";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { useFolderActions } from "~/hooks/useFolderActions";

interface FolderNameProps {
  folder: Folder;
}

export function FolderName({
  folder,
}: FolderNameProps) {
  const { renamingId, setRenamingId } = useFileSidebar();
  const { updateFolder } = useFolderActions();
  return (
    <EditableName
      initialName={folder.name || ""}
      defaultName={UNTITLED_FOLDER_NAME}
      isRenaming={renamingId === folder._id}
      onFinishRename={(name) => {
        updateFolder.mutate({ folderId: folder._id, name: name });
        setRenamingId(null);
      }}
    />
  );
}
