import CharacterDialog from '~/components/forms/category-tag-dialogs/character-tag-dialog/character-dialog'
import {
  CategoryContextMenu,
  type CategoryContextMenuProps,
} from '../generic-category-folder/category-context-menu'
import { UserPlus, Users } from '~/lib/icons'
import { useCampaign } from '~/contexts/CampaignContext'
import { useRouter } from '@tanstack/react-router'
import { forwardRef, useState } from 'react'
import type {
  ContextMenuItem,
  ContextMenuRef,
} from '~/components/context-menu/context-menu'
import { useFolderState } from '~/hooks/useFolderState'

export const CharacterCategoryFolderContextMenu = forwardRef<
  ContextMenuRef,
  CategoryContextMenuProps
>(({ categoryConfig, children, ...props }, ref) => {
  const router = useRouter()
  const { dmUsername, campaignSlug } = useCampaign()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { openFolder } = useFolderState(
    props.folder?._id || categoryConfig.categoryName,
  )

  const handleCreateItem = () => {
    openFolder()
    setIsCreateDialogOpen(true)
  }

  const itemsTransformation = (baseItems: ContextMenuItem[]) => {
    const items = [...baseItems]

    if (items[0] && items[0].type === 'action') {
      items[0] = {
        ...items[0],
        icon: <UserPlus className="h-4 w-4" />,
        onClick: handleCreateItem,
      }
    }

    if (!props.folder) {
      items.push({
        type: 'action' as const,
        icon: <Users className="h-4 w-4" />,
        label: `Go to ${categoryConfig.plural}`,
        onClick: () => {
          router.navigate({
            to: '/campaigns/$dmUsername/$campaignSlug/characters',
            params: {
              dmUsername,
              campaignSlug,
            },
          })
        },
      })
    }

    return items
  }

  return (
    <>
      <CategoryContextMenu
        ref={ref}
        categoryConfig={categoryConfig}
        itemsTransformation={itemsTransformation}
        {...props}
      >
        {children}
      </CategoryContextMenu>
      <CharacterDialog
        mode="create"
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        config={categoryConfig}
        parentFolderId={props.folder?._id}
        navigateToNote={false}
      />
    </>
  )
})
