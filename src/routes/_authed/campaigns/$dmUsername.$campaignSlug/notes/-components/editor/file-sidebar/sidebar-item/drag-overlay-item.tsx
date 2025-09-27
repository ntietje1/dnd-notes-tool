import { SIDEBAR_ITEM_TYPES, type AnySidebarItem } from "convex/notes/types";
import { FolderButton } from "../sidebar-folder/folder-button";
import { NoteButtonBase } from "../sidebar-note/note-button-base";
interface DragOverlayItemProps {
  item: AnySidebarItem;
}

export function DragOverlayItem({ item }: DragOverlayItemProps) {
  switch(item.type) {
    case SIDEBAR_ITEM_TYPES.folders:
      return <FolderButton folder={item} />;
    case SIDEBAR_ITEM_TYPES.notes:
      return <NoteButtonBase note={item} />;
    default:
      return null;
  }
}