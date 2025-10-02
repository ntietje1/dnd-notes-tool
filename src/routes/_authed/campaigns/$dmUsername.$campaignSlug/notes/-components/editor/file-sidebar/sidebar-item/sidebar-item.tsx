import { type AnySidebarItem, SIDEBAR_ITEM_TYPES } from 'convex/notes/types'
import { NoteButton } from '../sidebar-note/note-button'
import { FolderWithChildren } from '../sidebar-folder/folder-with-children'

interface SidebarItemProps {
  item: AnySidebarItem
  ancestorIds?: string[]
}

export const SidebarItem = ({ item, ancestorIds = [] }: SidebarItemProps) => {
  switch (item.type) {
    case SIDEBAR_ITEM_TYPES.folders:
      return <FolderWithChildren folder={item} ancestorIds={ancestorIds} />
    case SIDEBAR_ITEM_TYPES.notes:
      return <NoteButton note={item} />
    default:
      throw new Error('Invalid item type or missing required properties')
  }
}
