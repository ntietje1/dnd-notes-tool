import { Location } from './types'
import { Id } from '../_generated/dataModel'

export const combineLocationAndTag = (
  location: { _id: Id<'locations'> },
  tag: { _id: Id<'tags'> },
): Location => {
  return {
    ...location,
    ...tag,
    tagId: tag._id,
    locationId: location._id,
  } as Location
}
