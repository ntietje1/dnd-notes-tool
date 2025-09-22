

import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { useCurrentNote } from "~/hooks/useCurrentNote";
import { useRef } from "react";
import type { ContextMenuRef } from "~/components/context-menu/context-menu";
import { TagNoteContextMenu, type TagNoteContextMenuProps } from "./tag-note-context.menu";
import { NoteButtonBase } from "../../sidebar-note/note-button-base";
import type { TagWithNote } from "convex/tags/types";
import type { TagCategoryConfig } from "~/components/forms/category-tag-dialogs/base-tag-dialog/types";

interface TagNoteButtonProps {
  tagWithNote: TagWithNote;
  categoryConfig: TagCategoryConfig;
  contextMenuComponent?: React.ComponentType<TagNoteContextMenuProps>;
}

export function TagNoteButton({
  tagWithNote,
  categoryConfig,
  contextMenuComponent,
}: TagNoteButtonProps) {
  const { renamingId } = useFileSidebar();
  const { note: currentNote, selectNote } = useCurrentNote();
  const contextMenuRef = useRef<ContextMenuRef>(null);
  const note = tagWithNote.note;
  const isSelected = currentNote?.data?._id === note._id;

  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    contextMenuRef.current?.open({ x: e.clientX + 4, y: e.clientY + 4 });
  };

  const ContextMenuComponent = contextMenuComponent || TagNoteContextMenu;

  return (
    <ContextMenuComponent ref={contextMenuRef} tagWithNote={tagWithNote} categoryConfig={categoryConfig}>
        <NoteButtonBase
            note={note}
            handleSelect={() => selectNote(note._id)}
            handleMoreOptions={handleMoreOptions}
            isSelected={isSelected}
            isRenaming={renamingId === note._id}
        />
    </ContextMenuComponent>
  );
}
