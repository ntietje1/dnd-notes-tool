import { DraggableNote } from "../sidebar-note/draggable-note";
import { type Note, type AnySidebarItem, type Folder, SIDEBAR_ITEM_TYPES } from "convex/notes/types";
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
    case SIDEBAR_ITEM_TYPES.folders:
      return (
        <FolderWithChildren folder={item}/>
      );
    case SIDEBAR_ITEM_TYPES.notes:
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