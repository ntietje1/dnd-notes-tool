import CharacterDialog from '~/components/forms/category-tag-dialogs/character-tag-dialog/character-dialog'
import {
  CategoryContextMenu,
  type CategoryContextMenuProps,
} from '../generic-category-folder/category-context-menu'
import { User } from '~/lib/icons'
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
    // Clone the base items
    const items = [...baseItems]

    // Override the first item (Create New Character) with custom handler
    if (items[0] && items[0].type === 'action') {
      items[0] = {
        ...items[0],
        onClick: handleCreateItem,
      }
    }

    // Add "Go to Characters" option after the first item if we're at the root category (not in a subfolder)
    if (!props.folder) {
      items.splice(1, 0, {
        type: 'action' as const,
        icon: <User className="h-4 w-4" />,
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
