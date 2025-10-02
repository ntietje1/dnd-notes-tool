import {
  TagNoteContextMenu,
  type TagNoteContextMenuProps,
} from '../generic-category-folder/tag-note-context.menu'
import { forwardRef } from 'react'
import type { ContextMenuRef } from '~/components/context-menu/context-menu'

export const LocationNoteContextMenu = forwardRef<
  ContextMenuRef,
  TagNoteContextMenuProps
>(({ children, tagWithNote, categoryConfig, ...props }, ref) => {
  return (
    <TagNoteContextMenu
      ref={ref}
      tagWithNote={tagWithNote}
      categoryConfig={categoryConfig}
      {...props}
    >
      {children}
    </TagNoteContextMenu>
  )
})
