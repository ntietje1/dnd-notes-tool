import type { MouseEvent } from 'react'
import type { LucideIcon } from 'lucide-react'

/**
 * Base interface for any sidebar item that can be rendered
 */
export interface SidebarItemEntity {
  _id: string
  name?: string
  type: string
}

/**
 * Common handlers for sidebar item interactions
 */
export interface SidebarItemHandlers {
  onSelect?: (e: MouseEvent) => void
  onMoreOptions?: (e: MouseEvent) => void
  onToggleExpanded?: (e: MouseEvent) => void
}

/**
 * Common state for sidebar items
 */
export interface SidebarItemState {
  isSelected: boolean
  isRenaming: boolean
  isExpanded?: boolean
}

/**
 * Props for rendering a sidebar button
 */
export interface SidebarItemButtonProps
  extends SidebarItemHandlers,
    SidebarItemState {
  icon: LucideIcon
  name: string
  defaultName: string
  showChevron?: boolean
  onFinishRename?: (name: string) => void
}
