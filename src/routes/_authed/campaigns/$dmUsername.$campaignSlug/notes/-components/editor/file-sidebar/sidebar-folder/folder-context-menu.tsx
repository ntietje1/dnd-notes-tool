import type { Id } from "convex/_generated/dataModel";
import type { Folder } from "convex/notes/types";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ContextMenu, type ContextMenuItem } from "~/components/context-menu/context-menu";
import { ConfirmationDialog } from "~/components/dialogs/confirmation-dialog";
import { useCampaign } from "~/contexts/CampaignContext";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { useFolderActions } from "~/hooks/useFolderActions";
import { useNoteActions } from "~/hooks/useNoteActions";
import { FilePlus, FolderPlus, FolderEdit, Trash2 } from "~/lib/icons";

interface FolderContextMenuProps {
  folder: Folder;
  children: React.ReactNode;
}

export function FolderContextMenu({
  folder,
  children,
}: FolderContextMenuProps) {
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const { setRenamingId } = useFileSidebar();
  const { deleteFolder, createFolder } = useFolderActions();
  const { createNote } = useNoteActions();
  const { campaignWithMembership } = useCampaign();
  const campaignId = campaignWithMembership.data?.campaign._id;

  if (!campaignId) return children;

  const handleRenameFolder = () => {
    setRenamingId(folder._id);
  };

  const handleNewPage = async () => {
    await createNote.mutateAsync({ parentFolderId: folder._id, campaignId: campaignId })
    .then((noteId: Id<"notes">) => {
      setRenamingId(noteId);
    }).catch((error: Error) => {
      console.error(error);
      toast.error("Failed to create page");
    });
  };

  const handleNewFolder = async () => {
    await createFolder.mutateAsync({ parentFolderId: folder._id, campaignId: campaignId })
    .then((folderId: Id<"folders">) => {
      setRenamingId(folderId);
    }).catch((error: Error) => {
      console.error(error);
      toast.error("Failed to create folder");
    });
  };

  const handleDeleteFolder = async () => {
    setConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteFolder = useCallback(async () => {
    await deleteFolder.mutateAsync({ folderId: folder._id })
    .then(() => {
      toast.success("Folder deleted");
    }).catch((error: Error) => {
      console.error(error);
      toast.error("Failed to delete folder");
    }).finally(() => {
      setConfirmDeleteDialogOpen(false);
    });
  }, [deleteFolder, folder._id, setConfirmDeleteDialogOpen]);

  const menuItems: ContextMenuItem[] = [
    {
      label: "Rename Folder",
      icon: <FolderEdit className="h-4 w-4" />,
      onClick: handleRenameFolder,
    },
    {
      label: "New Page",
      icon: <FilePlus className="h-4 w-4" />,
      onClick: handleNewPage,
    },
    {
      label: "New Folder",
      icon: <FolderPlus className="h-4 w-4" />,
      onClick: handleNewFolder,
    },
    {
      label: "Delete Folder",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteFolder,
      className: "text-red-600 focus:text-red-600",
    },
  ];

  return (
    <>
      <ContextMenu items={menuItems}>{children}</ContextMenu>
      <ConfirmationDialog
        isOpen={confirmDeleteDialogOpen}
        onClose={() => setConfirmDeleteDialogOpen(false)}
        onConfirm={confirmDeleteFolder}
        title="Delete Folder"
        description="Are you sure you want to delete this folder and all its contents?"
        confirmLabel="Delete Folder"
        confirmVariant="destructive"
        icon={Trash2}
      />
    </>
  );
}
