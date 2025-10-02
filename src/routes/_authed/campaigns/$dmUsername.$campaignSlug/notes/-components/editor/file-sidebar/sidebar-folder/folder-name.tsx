import { UNTITLED_FOLDER_NAME } from 'convex/notes/types'
import type { Folder } from 'convex/notes/types'
import { useFolderActions } from '~/hooks/useFolderActions'
import { EditableItemName } from '../sidebar-item/editable-item-name'

interface FolderNameProps {
  folder: Folder
}

export function FolderName({ folder }: FolderNameProps) {
  const { updateFolder } = useFolderActions()

  return (
    <EditableItemName
      item={folder}
      defaultName={UNTITLED_FOLDER_NAME}
      updateItem={(id, name) =>
        updateFolder.mutateAsync({ folderId: id as any, name })
      }
    />
  )
}
