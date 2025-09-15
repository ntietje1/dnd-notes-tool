
import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";
import { GenericTagNoteContextMenu, type GenericTagNoteContextMenuProps } from "../generic-category-folder/generic-note-context.menu";


export function CharacterNoteContextMenu({
  children,
  tag,
}: GenericTagNoteContextMenuProps) {


  return (
    <GenericTagNoteContextMenu
      categoryName={SYSTEM_TAG_CATEGORY_NAMES.Character}
      tag={tag}
    >
      {children}
    </GenericTagNoteContextMenu>
  );
}
