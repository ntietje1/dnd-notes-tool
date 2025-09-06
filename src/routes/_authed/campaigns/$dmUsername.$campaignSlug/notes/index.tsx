import { createFileRoute } from '@tanstack/react-router'
import { NotesEditorEmptyContent } from './-components/editor/notes-editor'

export const Route = createFileRoute('/_authed/campaigns/$dmUsername/$campaignSlug/notes/')({
  component: NotesEditorEmptyContent,
})
