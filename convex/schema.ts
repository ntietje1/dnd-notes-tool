import { defineSchema, defineTable } from 'convex/server'
import { notesTables } from './notes/schema'
import { campaignTables } from './campaigns/schema'
import { editorTables } from './editors/schema'
import { userTables } from './users/schema'
import { characterTables } from './characters/schema'
import { locationTables } from './locations/schema'
import { tagTables } from './tags/schema'
import { v } from 'convex/values'

export default defineSchema({
  ...notesTables,
  ...editorTables,
  ...campaignTables,
  ...userTables,
  ...characterTables,
  ...locationTables,
  ...tagTables,
  posts: defineTable({
    id: v.string(),
    title: v.string(),
    body: v.string(),
  }).index('id', ['id']),

  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
})
