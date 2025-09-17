import { NoteButton } from "../sidebar-note/note-button";
import type { AnySidebarItem, Folder, Note } from "convex/notes/types";
import { FolderButton } from "../sidebar-folder/folder-button";

// Helper function to check item types
function isFolder(item: AnySidebarItem): item is Folder {
  return item.type === "folders";
}

function isNote(item: AnySidebarItem): item is Note {
  return item.type === "notes";
}

interface DragOverlayItemProps {
  item: AnySidebarItem;
}

// Drag overlay component that always shows collapsed state
export function DragOverlayItem({ item }: DragOverlayItemProps) {
  if (isFolder(item)) {
    return <FolderButton folder={item} />;
  }
  
  if (isNote(item)) {
    return <NoteButton note={item} />;
  }
  
  return null;
}