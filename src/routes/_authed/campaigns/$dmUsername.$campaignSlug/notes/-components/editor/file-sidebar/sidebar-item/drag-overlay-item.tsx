import type { AnySidebarItem } from "convex/notes/types";
import { FolderButton } from "../sidebar-folder/folder-button";
import { NoteButtonBase } from "../sidebar-note/note-button-base";
interface DragOverlayItemProps {
  item: AnySidebarItem;
}

export function DragOverlayItem({ item }: DragOverlayItemProps) {
  switch(item.type) {
    case "folders":
      return <FolderButton folder={item} />;
    case "notes":
      return <NoteButtonBase note={item} />;
    default:
      return null;
  }
}