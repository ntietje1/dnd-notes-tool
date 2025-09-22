import { FileEdit, Pencil, Trash2 } from "~/lib/icons";
import {
  ContextMenu,
  type ContextMenuItem,
  type ContextMenuRef,
} from "~/components/context-menu/context-menu";
import { useCallback, useState, forwardRef, useMemo } from "react";
import { ConfirmationDialog } from "~/components/dialogs/confirmation-dialog";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { toast } from "sonner";
import { useCurrentNote } from "~/hooks/useCurrentNote";
import type { TagWithNote } from "convex/tags/types";
import GenericTagDialog from "~/components/forms/category-tag-dialogs/generic-tag-dialog/generic-dialog";
import type { TagCategoryConfig } from "~/components/forms/category-tag-dialogs/base-tag-dialog/types";

export interface TagNoteContextMenuProps {
  children: React.ReactNode;
  tagWithNote: TagWithNote;
  categoryConfig: TagCategoryConfig;
  itemsTransformation?: (baseItems: ContextMenuItem[]) => ContextMenuItem[];
}

export const TagNoteContextMenu = forwardRef<ContextMenuRef, TagNoteContextMenuProps>(({
  children,
  tagWithNote,
  categoryConfig,
  itemsTransformation = (baseItems) => baseItems,
}, ref) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const { setRenamingId } = useFileSidebar();
  const { note: currentNote, selectNote } = useCurrentNote();
  const deleteTag = useMutation({ mutationFn: useConvexMutation(api.tags.mutations.deleteTag) });
  const note = tagWithNote.note;
  const tag = tagWithNote;

  const handleRename = () => {
    setRenamingId(note._id);
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    setConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteTag = useCallback(async () => {
    await deleteTag.mutateAsync({ tagId: tag._id })
    .then(() => {
      toast.success(`${tag.displayName} deleted successfully`);
      if (currentNote.data?._id === tag.noteId) {
        selectNote(null);
      }
    }).catch((error) => {
      console.error(error);
      toast.error(`Failed to delete ${tagWithNote.category.displayName}: ${tag.displayName}`);
    }).finally(() => {
      setConfirmDeleteDialogOpen(false);
    });
  }, [deleteTag, tag._id, setConfirmDeleteDialogOpen, tagWithNote.category, tag, currentNote.data?._id, selectNote]);

  const baseMenuItems: ContextMenuItem[] = [
    {
      type: "action",
      label: `Rename`,
      icon: <FileEdit className="h-4 w-4" />,
      onClick: handleRename,
    },
    {
      type: "action",
      label: `Edit`,
      icon: <Pencil className="h-4 w-4" />,
      onClick: handleEdit,
    },
    {
      type: "action",
      label: `Delete`,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      className: "text-red-600 focus:text-red-600",
    },
  ];

  const menuItems: ContextMenuItem[] = useMemo(
    () => itemsTransformation(baseMenuItems),
    [itemsTransformation, baseMenuItems]
  );

  return (
    <>
      <ContextMenu ref={ref} items={menuItems}>
        {children}
      </ContextMenu>
    
      <ConfirmationDialog
        isOpen={confirmDeleteDialogOpen}
        onClose={() => setConfirmDeleteDialogOpen(false)}
        onConfirm={confirmDeleteTag}
        title={`Delete ${tag.displayName}`}
        description={`Are you sure you want to delete this ${tag.displayName}?`}
        confirmLabel={`Delete ${tag.displayName}`}
        confirmVariant="destructive"
        icon={Trash2}
      />

      <GenericTagDialog
        mode="edit"
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        config={categoryConfig}
        tag={tag}
      />
    </>
  );
});
