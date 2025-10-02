import { useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from 'convex/_generated/api'
import { useComponentsContext } from '@blocknote/react'
import { Share2 } from '~/lib/icons'
import { toast } from 'sonner'
import type { CustomBlock } from '~/lib/editor-schema'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useCampaign } from '~/contexts/CampaignContext'
import type { Tag } from 'convex/tags/types'
import type { CampaignMember } from 'convex/campaigns/types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '~/components/shadcn/ui/dropdown-menu'
import { useCurrentNote } from '~/hooks/useCurrentNote'

interface ShareSideMenuButtonProps {
  block: CustomBlock
  freezeMenu: () => void
  unfreezeMenu: () => void
}

export default function ShareSideMenuButton({
  block,
  freezeMenu,
  unfreezeMenu,
}: ShareSideMenuButtonProps) {
  const { note } = useCurrentNote()
  const { campaignWithMembership } = useCampaign()
  const campaign = campaignWithMembership?.data?.campaign
  const Components = useComponentsContext()!

  const blockTagState = useQuery(
    convexQuery(
      api.notes.queries.getBlockTagState,
      note.data?._id
        ? {
            noteId: note.data._id,
            blockId: block.id,
          }
        : 'skip',
    ),
  )

  const addTagToBlock = useMutation({
    mutationFn: useConvexMutation(api.notes.mutations.addTagToBlockMutation),
  })
  const removeTagFromBlock = useMutation({
    mutationFn: useConvexMutation(
      api.notes.mutations.removeTagFromBlockMutation,
    ),
  })
  const isMutating = addTagToBlock.isPending || removeTagFromBlock.isPending

  const sharedTagQueryResult = useQuery(
    convexQuery(
      api.tags.queries.getSharedTags,
      campaign?._id ? { campaignId: campaign._id } : 'skip',
    ),
  )
  const { sharedAllTag, playerSharedTags } = sharedTagQueryResult.data || {}

  const playersResult = useQuery(
    convexQuery(
      api.campaigns.queries.getPlayersByCampaign,
      campaign?._id ? { campaignId: campaign._id } : 'skip',
    ),
  )

  const getUserByMemberId = (memberId: string): CampaignMember | undefined => {
    return playersResult.data?.find((m) => m._id === memberId)
  }

  const appliedTagIds = blockTagState.data?.allTagIds || []
  const isShared = useMemo(() => {
    if (!sharedAllTag || !playerSharedTags) return false
    if (appliedTagIds.includes(sharedAllTag._id)) return true
    return playerSharedTags.some((t: Tag) => appliedTagIds.includes(t._id))
  }, [appliedTagIds, sharedAllTag, playerSharedTags])

  const toggleShareTag = async (tag: Tag) => {
    if (!note.data) return
    if (isMutating) return
    const isApplied = appliedTagIds.includes(tag._id)
    try {
      if (isApplied) {
        await removeTagFromBlock.mutateAsync({
          noteId: note.data._id,
          blockId: block.id,
          tagId: tag._id,
        })
      } else {
        await addTagToBlock.mutateAsync({
          noteId: note.data._id,
          blockId: block.id,
          tagId: tag._id,
        })
      }
    } catch (error) {
      toast.error('Failed to toggle share')
    }
  }

  const handleButtonClick = async (e: React.MouseEvent) => {
    if (!note.data) return
    if (isMutating) return
    if (e.ctrlKey) {
      if (sharedAllTag) {
        await toggleShareTag(sharedAllTag)
      }
      return
    }
  }

  const items: {
    key: string
    name?: string
    username?: string
    tag: Tag
    applied: boolean
  }[] = useMemo(() => {
    const list: {
      key: string
      name?: string
      username?: string
      tag: Tag
      applied: boolean
    }[] = []
    if (sharedAllTag) {
      list.push({
        key: `all-${sharedAllTag._id}`,
        name: 'All players',
        tag: sharedAllTag,
        applied: appliedTagIds.includes(sharedAllTag._id),
      })
    }
    ;(playerSharedTags || []).forEach((t: Tag) => {
      const member = t.memberId ? getUserByMemberId(t.memberId) : undefined
      const profile = member?.userProfile
      const fullName = profile?.name || undefined
      const username = profile?.username
      list.push({
        key: `player-${t._id}`,
        name: fullName,
        username,
        tag: t,
        applied: appliedTagIds.includes(t._id),
      })
    })
    return list
  }, [sharedAllTag, playerSharedTags, appliedTagIds])

  return (
    <DropdownMenu
      onOpenChange={(open: boolean) => {
        if (open) {
          freezeMenu()
        } else {
          unfreezeMenu()
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Components.SideMenu.Button
          label={isShared ? 'Shared' : 'Share'}
          className={`!p-0 !px-0 !h-6 !w-6 ${isShared ? '!text-blue-600' : ''}`}
          onClick={handleButtonClick}
          icon={<Share2 size={18} />}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        className="w-56 max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto"
      >
        <DropdownMenuLabel>Share with</DropdownMenuLabel>
        {items.map((it) => (
          <DropdownMenuCheckboxItem
            key={it.key}
            checked={it.applied}
            disabled={isMutating}
            indicatorAlign="right"
            className="pl-2 pr-8 py-1.5"
            aria-label={`Share with ${it.name || it.username || 'Player'}`}
            onSelect={async (e) => {
              e.preventDefault()
              await toggleShareTag(it.tag)
            }}
          >
            <span className="flex min-w-0 flex-col leading-tight">
              <span
                className="truncate font-medium"
                title={it.name || (it.username ? `@${it.username}` : 'Player')}
              >
                {it.name ? it.name : it.username ? `@${it.username}` : 'Player'}
              </span>
              {it.name && it.username && (
                <span
                  className="truncate text-xs text-muted-foreground"
                  title={`@${it.username}`}
                >
                  @{it.username}
                </span>
              )}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
