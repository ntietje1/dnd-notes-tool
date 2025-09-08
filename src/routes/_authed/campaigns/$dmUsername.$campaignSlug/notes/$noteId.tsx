import { ClientOnly, createFileRoute, useParams } from '@tanstack/react-router'
import { NotesEditor, NotesEditorEmptyContent, NotesEditorSkeleton } from './-components/editor/notes-editor';
import { useNotes } from '~/contexts/NotesContext';
import type { Id } from 'convex/_generated/dataModel';
import { useEffect } from 'react';


export const Route = createFileRoute('/_authed/campaigns/$dmUsername/$campaignSlug/notes/$noteId')({
  component: NotesDetailPage,
})

function NotesDetailPage() {
    const { noteId } = useParams({
        from: '/_authed/campaigns/$dmUsername/$campaignSlug/notes/$noteId'
    });
    const { setNoteId } = useNotes();
    useEffect(() => {
        setNoteId(noteId as Id<"notes">);
    }, [noteId, setNoteId]);

    return (
        <ClientOnly fallback={<NotesEditorSkeleton />}>
            {noteId ? <NotesEditor noteId={noteId} /> : <NotesEditorEmptyContent />}
        </ClientOnly>
    );
}
    