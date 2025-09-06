import { createFileRoute } from '@tanstack/react-router'
import { NotesPage } from './-components/page/index'

export const Route = createFileRoute('/_authed/campaigns/$dmUsername/$campaignSlug/notes/$noteId')({
  component: NotesPage,
})
