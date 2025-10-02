import { useDraggable, useDroppable } from '@dnd-kit/core'
import { cn } from '~/lib/utils'
import type { SidebarItemEntity } from './types'
import { canDropItem } from '../dnd-utils'

interface DndWrapperProps<T extends SidebarItemEntity> {
  item: T
  ancestorIds?: string[]
  categoryId?: string
  type?: string
  children: React.ReactNode
  isDraggable?: boolean
  isDroppable?: boolean
  accepts?: string[]
}

/**
 * Generic drag-and-drop wrapper for any sidebar entity
 * Handles both draggable and droppable functionality
 */
export function DndWrapper<T extends SidebarItemEntity>({
  item,
  ancestorIds = [],
  categoryId,
  type,
  children,
  isDraggable = true,
  isDroppable = false,
  accepts = [],
}: DndWrapperProps<T>) {
  // Draggable setup
  const draggableSetup = useDraggable({
    id: item._id,
    data: {
      ...item,
      ancestorIds,
      categoryId,
      type,
    },
    disabled: !isDraggable,
  })

  // Droppable setup
  const droppableSetup = useDroppable({
    id: item._id,
    data: {
      accepts,
      id: item._id,
      categoryId,
      ancestorIds,
      type,
    },
    disabled: !isDroppable,
  })

  const canDrop = isDroppable
    ? canDropItem(droppableSetup.active, droppableSetup.over)
    : false
  const isValidDrop = droppableSetup.isOver && canDrop

  // Combine refs if both draggable and droppable
  const setNodeRef = (node: HTMLElement | null) => {
    if (isDraggable) draggableSetup.setNodeRef(node)
    if (isDroppable) droppableSetup.setNodeRef(node)
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-full min-w-0',
        isDraggable && draggableSetup.isDragging && 'opacity-50',
        isDroppable && 'transition-colors',
        isValidDrop && 'bg-muted',
      )}
      {...(isDraggable ? draggableSetup.listeners : {})}
      {...(isDraggable ? draggableSetup.attributes : {})}
    >
      {children}
    </div>
  )
}
