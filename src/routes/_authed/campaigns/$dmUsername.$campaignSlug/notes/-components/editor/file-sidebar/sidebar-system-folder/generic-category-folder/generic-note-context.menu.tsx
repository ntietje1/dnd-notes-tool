import { FileEdit, Pencil, Trash2 } from "~/lib/icons";
import {
  ContextMenu,
  type ContextMenuItem,
} from "~/components/context-menu/context-menu";
import { useCallback, useState } from "react";
import { ConfirmationDialog } from "~/components/dialogs/confirmation-dialog";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import type { Tag } from "convex/tags/types";
import { toast } from "sonner";
import { useCurrentNote } from "~/hooks/useCurrentNote";

export interface GenericTagNoteContextMenuProps {
  children: React.ReactNode;
  categoryName: string;
  tag: Tag;
  onEdit?: (tag: Tag) => void;
  onRename?: (tag: Tag) => void;
  additionalItems?: (args: { tag: Tag; categoryName: string, baseMenuItems: ContextMenuItem[] }) => ContextMenuItem[];
}

export function GenericTagNoteContextMenu({
  children,
  categoryName: displayName,
  tag,
  onEdit,
  onRename,
  additionalItems,
}: GenericTagNoteContextMenuProps) {
  // const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const { setRenamingId } = useFileSidebar();
  const { note: currentNote, selectNote } = useCurrentNote();
  const deleteTag = useMutation({ mutationFn: useConvexMutation(api.tags.mutations.deleteTag) });

  const handleRename = () => {
    if (onRename) {
      onRename(tag);
      return;
    }
    setRenamingId(tag.noteId ?? null);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(tag);
      return;
    }
    toast.info(`Edit ${displayName} not implemented yet`);
    // setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    setConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteTag = useCallback(async () => {
    await deleteTag.mutateAsync({ tagId: tag._id })
    .then(() => {
      toast.success(`${displayName} deleted successfully`);
      if (currentNote.data?._id === tag.noteId) {
        selectNote(null);
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to delete ${displayName}`);
    }).finally(() => {
      setConfirmDeleteDialogOpen(false);
    });
  }, [deleteTag, tag._id, setConfirmDeleteDialogOpen, displayName, tag, currentNote.data?._id, selectNote]);

  const baseMenuItems: ContextMenuItem[] = [
    {
      label: `Rename ${displayName}`,
      icon: <FileEdit className="h-4 w-4" />,
      onClick: handleRename,
    },
    {
      label: `Edit ${displayName}`,
      icon: <Pencil className="h-4 w-4" />,
      onClick: handleEdit,
    },
    {
      label: `Delete ${displayName}`,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      className: "text-red-600 focus:text-red-600",
    },
  ];

  const extraItems: ContextMenuItem[] = additionalItems
    ? additionalItems({ tag, categoryName: displayName, baseMenuItems })
    : [];

  const menuItems: ContextMenuItem[] = [...baseMenuItems, ...extraItems];

  return (
    <>
      <ContextMenu items={menuItems}>{children}</ContextMenu>
    
      <ConfirmationDialog
        isOpen={confirmDeleteDialogOpen}
        onClose={() => setConfirmDeleteDialogOpen(false)}
        onConfirm={confirmDeleteTag}
        title={`Delete ${displayName}`}
        description={`Are you sure you want to delete this ${displayName}?`}
        confirmLabel={`Delete ${displayName}`}
        confirmVariant="destructive"
        icon={Trash2}
      />
    </>
  );
}
