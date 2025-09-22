
import { TagNoteContextMenu, type TagNoteContextMenuProps } from "../generic-category-folder/tag-note-context.menu";
import { forwardRef } from "react";
import type { ContextMenuRef } from "~/components/context-menu/context-menu";
import { LOCATION_CONFIG } from "~/components/forms/category-tag-dialogs/location-tag-dialog/types";

export const LocationNoteContextMenu = forwardRef<ContextMenuRef, TagNoteContextMenuProps>(({
  children,
  tagWithNote,
}, ref) => {
  return (
    <TagNoteContextMenu
      ref={ref}
      tagWithNote={tagWithNote}
      categoryConfig={LOCATION_CONFIG}
    >
      {children}
    </TagNoteContextMenu>
  );
});
