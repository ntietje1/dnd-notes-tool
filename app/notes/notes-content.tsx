"use client";

import { useNotes } from "@/contexts/NotesContext";
import { FileTopbar } from "@/components/file-topbar/topbar";
import { SimpleEditor } from "@/components/custom-tiptap-ui/editor/editor";

export function NotesEditor() {
  const { selectedNote, updateNoteContent, updateNoteTitle } = useNotes();

  if (!selectedNote) {
    return <div>Select a note to begin editing</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <FileTopbar note={selectedNote} onTitleChange={updateNoteTitle} />
      <SimpleEditor
        content={selectedNote.content}
        onUpdate={({ editor }) => updateNoteContent(editor)}
      />
    </div>
  );
}
