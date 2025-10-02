import { MapPin } from '~/lib/icons'
import type {
  BaseTagFormValues,
  TagCategoryConfig,
} from '../base-tag-dialog/types'
import { SYSTEM_TAG_CATEGORY_NAMES } from 'convex/tags/types'

export interface LocationFormValues extends BaseTagFormValues {}

export const defaultLocationFormValues: LocationFormValues = {
  name: '',
  description: '',
  color: '#ef4444',
}

export const LOCATION_CONFIG: TagCategoryConfig = {
  singular: 'Location',
  plural: 'Locations',
  icon: MapPin,
  categoryName: SYSTEM_TAG_CATEGORY_NAMES.Location,
}
