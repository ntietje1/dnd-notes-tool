import { SIDEBAR_ITEM_TYPES, type AnySidebarItem } from 'convex/notes/types'
import { SidebarItemButtonBase } from './sidebar-item-button-base'
import { Folder as FolderIcon, FileText } from '~/lib/icons'
import { UNTITLED_FOLDER_NAME, UNTITLED_NOTE_TITLE } from 'convex/notes/types'

/**
 * Renders a drag overlay for any sidebar item type
 * Shows a non-interactive preview of the item being dragged
 */
export function DragOverlayItem({ item }: { item: AnySidebarItem }) {
  const isFolder = item.type === SIDEBAR_ITEM_TYPES.folders
  const icon = isFolder ? FolderIcon : FileText
  const defaultName = isFolder ? UNTITLED_FOLDER_NAME : UNTITLED_NOTE_TITLE

  return (
    <div className="border border-primary shadow-lg rounded-sm">
      <SidebarItemButtonBase
        icon={icon}
        name={item.name || ''}
        defaultName={defaultName}
        isSelected={false}
        isRenaming={false}
        showChevron={isFolder}
      />
    </div>
  )
}
