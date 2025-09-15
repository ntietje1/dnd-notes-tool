import { DraggableNote } from "../sidebar-note/draggable-note";
import type { Note, AnySidebarItem, Folder } from "convex/notes/types";
import { NoteButton } from "../sidebar-note/note-button";
import { FolderWithChildren } from "../sidebar-folder/folder-with-children";
import { NoteContextMenu } from "../sidebar-note/note-context-menu";

//TODO: use switch statement instead
function isFolder(item: AnySidebarItem): item is Folder {
  return item.type === "folders";
}

function isNote(item: AnySidebarItem): item is Note {
  return item.type === "notes";
}

interface SidebarItemProps {
  item: AnySidebarItem;

}

export const SidebarItem = ({
  item
}: SidebarItemProps) => {
  if (isFolder(item)) {
    return (
      <FolderWithChildren folder={item}/>
    );
  }

  if (isNote(item)) {
    return (
      <DraggableNote note={item}>
        <NoteContextMenu note={item}>
          <NoteButton note={item} />
        </NoteContextMenu>
      </DraggableNote>
    );
  }

  throw new Error("Invalid item type or missing required properties");
};