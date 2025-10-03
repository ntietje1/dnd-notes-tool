import { Id } from '../_generated/dataModel'
import { Tag } from '../tags/types'

export type Character = Tag & {
  tagId: Id<'tags'>
  characterId: Id<'characters'>
  playerId?: Id<'campaignMembers'>
}
