import { DraggableNote } from "../sidebar-note/draggable-note";
import type { Note, AnySidebarItem, Folder } from "convex/notes/types";
import { NoteButton } from "../sidebar-note/note-button";
import { FolderWithChildren } from "../sidebar-folder/folder-with-children";
import { NoteContextMenu } from "../sidebar-note/note-context-menu";
interface SidebarItemProps {
  item: AnySidebarItem;

}

export const SidebarItem = ({
  item
}: SidebarItemProps) => {
  switch(item.type) {
    case "folders":
      return (
        <FolderWithChildren folder={item}/>
      );
    case "notes":
      return (
        <DraggableNote note={item}>
          <NoteContextMenu note={item}>
            <NoteButton note={item} />
          </NoteContextMenu>
        </DraggableNote>
      );
    default:
      throw new Error("Invalid item type or missing required properties");
  }
}