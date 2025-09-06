import { ClientOnly, createFileRoute, useParams } from '@tanstack/react-router'
import { NotesEditor, NotesEditorSkeleton } from './-components/editor/notes-editor';


export const Route = createFileRoute('/_authed/campaigns/$dmUsername/$campaignSlug/notes/$noteId')({
  component: NotesDetailPage,
})

function NotesDetailPage() {
    const { noteId } = useParams({
        from: '/_authed/campaigns/$dmUsername/$campaignSlug/notes/$noteId'
    });

    return (
        <ClientOnly fallback={<NotesEditorSkeleton />}>
            <NotesEditor noteId={noteId} />
        </ClientOnly>
    );
}
    