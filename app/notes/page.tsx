"use client";

import { SimpleEditor } from "@/components/custom-tiptap-ui/editor/editor";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useState } from "react";
import { debounce } from "lodash";
import { type Editor } from "@tiptap/react";
import type { SaveNoteArgs, Note } from "@/convex/types";
import { FileSidebar } from "@/components/file-sidebar/sidebar";
import { FileTopbar } from "@/components/file-topbar/topbar";
import { OptimisticLocalStore } from "convex/browser";
import { Id } from "@/convex/_generated/dataModel";

export default function NotesPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<Id<"notes"> | undefined>(
    undefined,
  );
  const savedNote = useQuery(api.notes.getNote, { noteId: selectedNoteId });
  const saveNote = useMutation(api.notes.saveNote).withOptimisticUpdate(
    (store: OptimisticLocalStore, args: SaveNoteArgs) => {
      // Update the note query
      if (!selectedNoteId) return;
      const currentNote = store.getQuery(api.notes.getNote, {
        noteId: selectedNoteId,
      });
      if (currentNote && args.title !== undefined) {
        store.setQuery(
          api.notes.getNote,
          { noteId: selectedNoteId },
          {
            ...currentNote,
            title: args.title,
          },
        );
      }

      // Update the sidebar data query
      const sidebarData = store.getQuery(api.notes.getSidebarData, {});
      if (sidebarData && args.title !== undefined) {
        store.setQuery(
          api.notes.getSidebarData,
          {},
          {
            ...sidebarData,
            notes: sidebarData.notes.map((note: Note) =>
              note._id === args.noteId ? { ...note, title: args.title } : note,
            ),
          },
        );
      }
    },
  );

  // Debounced save function to prevent too many saves
  const debouncedSave = useCallback(
    debounce((args: SaveNoteArgs) => {
      console.log("saving content", args.content);
      saveNote(args);
    }, 1000),
    [saveNote],
  );

  const handleContentUpdate = useCallback(
    ({ editor }: { editor: Editor }) => {
      const content = editor.getJSON();
      if (!savedNote?._id) return;
      debouncedSave({
        noteId: savedNote?._id,
        content,
      });
    },
    [debouncedSave, savedNote?._id],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      if (savedNote?._id) {
        saveNote({
          noteId: savedNote._id,
          title,
        });
      }
    },
    [saveNote, savedNote?._id],
  );

  const handleNoteSelected = useCallback((note: Note) => {
    setSelectedNoteId(note._id);
  }, []);

  return (
    <div className="flex flex-row h-screen">
      <FileSidebar onNoteSelected={handleNoteSelected} />
      <div className="flex-1 items-center justify-center h-screen">
        <FileTopbar
          note={savedNote || null}
          onTitleChange={handleTitleChange}
          onClose={() => {}}
          onDelete={() => {}}
          onShare={() => {}}
          onExport={() => {}}
        />
        <SimpleEditor
          content={savedNote?.content}
          onUpdate={handleContentUpdate}
        />
      </div>
    </div>
  );
}
