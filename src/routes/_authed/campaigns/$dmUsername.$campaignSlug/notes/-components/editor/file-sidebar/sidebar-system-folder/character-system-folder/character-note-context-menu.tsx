import {
  TagNoteContextMenu,
  type TagNoteContextMenuProps,
} from '../generic-category-folder/tag-note-context.menu'
import { forwardRef } from 'react'
import type { ContextMenuRef } from '~/components/context-menu/context-menu'

export const CharacterNoteContextMenu = forwardRef<
  ContextMenuRef,
  TagNoteContextMenuProps
>(({ children, noteWithTag, categoryConfig, ...props }, ref) => {
  // const character = useQuery(convexQuery(api.characters.queries.getCharacterByTagId, { tagId: tag._id }));
  return (
    <TagNoteContextMenu
      ref={ref}
      noteWithTag={noteWithTag}
      categoryConfig={categoryConfig}
      {...props}
    >
      {children}
    </TagNoteContextMenu>
  )
})
