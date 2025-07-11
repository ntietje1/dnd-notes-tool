"use client";

import { useNotes } from "@/contexts/NotesContext";
import { FileTopbar } from "@/components/file-topbar/topbar";
import { SimpleEditor } from "@/components/custom-tiptap-ui/editor/editor";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotesEditor() {
  const {
    currentNoteId,
    selectedNote,
    updateNoteContent,
    updateNoteTitle,
    createNote,
  } = useNotes();

  if (currentNoteId && selectedNote === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <FileX className="h-16 w-16" />
        <h2 className="text-lg font-medium">Note not found</h2>
        <p>This note may have been deleted or you don't have access to it.</p>
      </div>
    );
  } else if (!currentNoteId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <FileX className="h-16 w-16" />
        <h2 className="text-lg font-medium">No note selected</h2>
        <Button onClick={() => createNote()}>Create a new note</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <FileTopbar note={selectedNote ?? null} onTitleChange={updateNoteTitle} />
      <SimpleEditor
        className="h-full"
        onUpdate={({ editor }) => updateNoteContent(editor)}
      />
    </div>
  );
}
