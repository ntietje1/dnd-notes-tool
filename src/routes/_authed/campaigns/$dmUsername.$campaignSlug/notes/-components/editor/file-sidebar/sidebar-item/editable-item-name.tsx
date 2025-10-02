import { useFileSidebar } from '~/contexts/FileSidebarContext'
import { EditableName } from './editable-name'
import type { SidebarItemEntity } from './types'

interface EditableItemNameProps<T extends SidebarItemEntity> {
  item: T
  defaultName: string
  updateItem: (id: string, name: string) => Promise<any>
}

/**
 * Generic editable name component that works with any sidebar entity
 * Handles renaming state and updates automatically
 */
export function EditableItemName<T extends SidebarItemEntity>({
  item,
  defaultName,
  updateItem,
}: EditableItemNameProps<T>) {
  const { renamingId, setRenamingId } = useFileSidebar()
  const isRenaming = renamingId === item._id

  const handleFinishRename = async (name: string) => {
    await updateItem(item._id, name)
    setRenamingId(null)
  }

  return (
    <EditableName
      initialName={item.name || ''}
      defaultName={defaultName}
      isRenaming={isRenaming}
      onFinishRename={handleFinishRename}
    />
  )
}
