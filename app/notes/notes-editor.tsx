"use client";

import { useNotes } from "@/contexts/NotesContext";
import { FileTopbar } from "@/components/file-topbar/topbar";
import { SimpleEditor } from "@/components/custom-tiptap-ui/editor/editor";

export function NotesEditor() {
  const { selectedNote, updateNoteContent, updateNoteTitle } = useNotes();

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
