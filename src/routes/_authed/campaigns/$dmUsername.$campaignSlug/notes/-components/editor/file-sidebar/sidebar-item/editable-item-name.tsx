import { useFileSidebar } from '~/contexts/FileSidebarContext'
import { EditableName } from './editable-name'
import type { SidebarItemEntity } from './types'
import { toast } from 'sonner'

interface EditableItemNameProps<T extends SidebarItemEntity> {
  item: T
  defaultName: string
  updateItem: (id: T['_id'], name: string) => Promise<T['_id']>
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
    try {
      console.log('handleFinishRename', item._id, name)
      await updateItem(item._id, name)
    } catch (error) {
      console.error(error)
      toast.error('Failed to update item')
    } finally {
      setRenamingId(null)
    }
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
