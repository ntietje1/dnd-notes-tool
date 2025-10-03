import type { Active, Over } from '@dnd-kit/core'
import type { Id } from 'convex/_generated/dataModel'
import { SIDEBAR_ITEM_TYPES, SIDEBAR_ROOT_TYPE } from 'convex/notes/types'

/**
 * Extended drag data that includes ancestor tracking
 */
export interface DragData {
  _id: string
  type: string
  categoryId?: Id<'tagCategories'> | null
  ancestorIds?: string[]
  [key: string]: any
}

/**
 * Extended drop data that includes ancestor tracking
 */
export interface DropData {
  id: string
  type: string
  categoryId?: Id<'tagCategories'> | null
  ancestorIds?: string[]
  accepts?: string[]
  [key: string]: any
}

/**
 * Check if two items belong to the same category
 * Both must have the same categoryId (or both be undefined/null for general items)
 */
export function categoriesMatch(
  draggedCategoryId: Id<'tagCategories'> | null | undefined,
  targetCategoryId: Id<'tagCategories'> | null | undefined,
): boolean {
  return (
    draggedCategoryId === targetCategoryId ||
    (draggedCategoryId === undefined && targetCategoryId === undefined) ||
    (draggedCategoryId === null && targetCategoryId === null)
  )
}

/**
 * Check if a folder is being dropped into one of its own descendants
 */
export function isDescendant(
  draggedFolderId: string,
  targetAncestorIds: string[],
): boolean {
  return targetAncestorIds.includes(draggedFolderId)
}

/**
 * Validate if a folder can be dropped into a target
 */
export function canDropFolder(
  active: Active | null,
  over: Over | null,
): boolean {
  if (!active || !over) return false

  const draggedItem = active.data.current as DragData
  const targetData = over.data.current as DropData

  // Only allow folder drops
  if (draggedItem.type !== SIDEBAR_ITEM_TYPES.folders) return false

  // Prevent dropping a folder into its own descendants
  const targetAncestorIds = targetData?.ancestorIds || []
  if (isDescendant(draggedItem._id, targetAncestorIds)) return false

  return true
}

/**
 * Validate if a note can be dropped into a target
 */
export function canDropNote(active: Active | null, over: Over | null): boolean {
  if (!active || !over) return false

  const draggedItem = active.data.current as DragData

  // Only allow note drops
  if (draggedItem.type !== SIDEBAR_ITEM_TYPES.notes) return false

  return true
}

/**
 * Validate if any item can be dropped into a target
 */
export function canDropItem(active: Active | null, over: Over | null): boolean {
  if (!active || !over) return false

  const draggedItem = active.data.current as DragData
  const targetData = over.data.current as DropData

  // Prevent dragging onto the direct parent
  if (
    (targetData.type === SIDEBAR_ROOT_TYPE && !draggedItem.parentFolderId) ||
    (targetData.type === SIDEBAR_ITEM_TYPES.folders &&
      draggedItem.parentFolderId === over.id)
  ) {
    return false
  }

  // Prevent dropping onto itself
  if (over.id === draggedItem._id) return false

  // Check category matching
  if (!categoriesMatch(draggedItem.categoryId, targetData?.categoryId)) {
    return false
  }

  if (draggedItem.type === SIDEBAR_ITEM_TYPES.folders) {
    return canDropFolder(active, over)
  }

  if (draggedItem.type === SIDEBAR_ITEM_TYPES.notes) {
    return canDropNote(active, over)
  }

  return false
}
