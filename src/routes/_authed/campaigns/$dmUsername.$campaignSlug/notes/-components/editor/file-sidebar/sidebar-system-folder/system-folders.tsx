import { cn } from '~/lib/utils'
import { CategoryFolderButton } from './generic-category-folder/category-folder-button'
import { CharacterCategoryFolderContextMenu } from './character-system-folder/character-category-context-menu'
import { CharacterNoteContextMenu } from './character-system-folder/character-note-context-menu'
import { LocationCategoryFolderContextMenu } from './location-system-folder/location-category-context-menu'
import { LocationNoteContextMenu } from './location-system-folder/location-note-context-menu'
import { CHARACTER_CONFIG } from '~/components/forms/category-tag-dialogs/character-tag-dialog/types'
import { LOCATION_CONFIG } from '~/components/forms/category-tag-dialogs/location-tag-dialog/types'
import { SessionSystemFolder } from './session-system-folder/session-system-folder'

interface SystemFoldersProps {
  className?: string
}

export const SystemFolders = ({ className }: SystemFoldersProps) => {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <CategoryFolderButton
        categoryConfig={CHARACTER_CONFIG}
        categoryContextMenu={CharacterCategoryFolderContextMenu}
        tagNoteContextMenu={CharacterNoteContextMenu}
      />
      <CategoryFolderButton
        categoryConfig={LOCATION_CONFIG}
        categoryContextMenu={LocationCategoryFolderContextMenu}
        tagNoteContextMenu={LocationNoteContextMenu}
      />
      <SessionSystemFolder />
    </div>
  )
}
