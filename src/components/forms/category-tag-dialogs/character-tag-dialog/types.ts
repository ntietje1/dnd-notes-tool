import type { Id } from 'convex/_generated/dataModel'
import type {
  BaseTagFormValues,
  TagCategoryConfig,
} from '../base-tag-dialog/types'
import { Users } from '~/lib/icons'
import { SYSTEM_TAG_CATEGORY_NAMES } from 'convex/tags/types'

export interface CharacterFormValues extends BaseTagFormValues {
  playerId?: Id<'campaignMembers'> | ''
}

export const defaultCharacterFormValues: CharacterFormValues = {
  name: '',
  description: '',
  color: '#ef4444',
  playerId: '',
}

export const CHARACTER_CONFIG: TagCategoryConfig = {
  singular: 'Character',
  plural: 'Characters',
  icon: Users,
  categoryName: SYSTEM_TAG_CATEGORY_NAMES.Character,
}
