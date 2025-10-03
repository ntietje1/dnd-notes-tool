import { Id } from '../_generated/dataModel'

export type UserProfile = {
  _id: Id<'userProfiles'>
  _creationTime: number

  userId: string
  username: string
  name?: string
  firstName?: string
  lastName?: string
  updatedAt: number
}
