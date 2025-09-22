
import { TagNoteContextMenu, type TagNoteContextMenuProps } from "../generic-category-folder/tag-note-context.menu";
import { forwardRef } from "react";
import type { ContextMenuRef } from "~/components/context-menu/context-menu";
import { CHARACTER_CONFIG } from "~/components/forms/category-tag-dialogs/character-tag-dialog/types";

export const CharacterNoteContextMenu = forwardRef<ContextMenuRef, TagNoteContextMenuProps>(({
  children,
  tagWithNote,
}, ref) => {
  // const character = useQuery(convexQuery(api.characters.queries.getCharacterByTagId, { tagId: tag._id }));
  return (
    <TagNoteContextMenu
      ref={ref}
      tagWithNote={tagWithNote}
      categoryConfig={CHARACTER_CONFIG}
    >
      {children}
    </TagNoteContextMenu>
  );
});
