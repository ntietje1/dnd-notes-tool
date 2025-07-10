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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function NotesPage() {
  const [selectedNoteId, setSelectedNoteId] = useState<Id<"notes"> | undefined>(
    undefined,
  );
  const [optimisticNote, setOptimisticNote] = useState<Note | null>(null);

  const savedNote = useQuery(api.notes.getNote, {
    noteId: selectedNoteId,
  });

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
      const noteId = optimisticNote?._id || savedNote?._id;
      if (!noteId) return;

      // Update optimistic note
      if (optimisticNote) {
        setOptimisticNote((prev) => (prev ? { ...prev, content } : null));
      }

      debouncedSave({
        noteId,
        content,
      });
    },
    [debouncedSave, savedNote?._id, optimisticNote],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      const noteId = optimisticNote?._id || savedNote?._id;
      if (!noteId) return;

      // Update optimistic note
      if (optimisticNote) {
        setOptimisticNote((prev) => (prev ? { ...prev, title } : null));
      }

      saveNote({
        noteId,
        title,
      });
    },
    [saveNote, savedNote?._id, optimisticNote],
  );

  const handleNoteSelected = useCallback((note: Note) => {
    setSelectedNoteId(note._id);
    // Set optimistic note immediately
    setOptimisticNote(note);
  }, []);

  // Clear optimistic note when the real note loads
  if (savedNote && optimisticNote?._id === savedNote._id) {
    setOptimisticNote(null);
  }

  // Use optimistic note if available, otherwise use saved note
  const displayedNote = optimisticNote || savedNote || null;

  return (
    <ResizablePanelGroup direction="horizontal" className="h-auto">
      <ResizablePanel defaultSize={25} minSize={10} maxSize={40}>
        <FileSidebar onNoteSelected={handleNoteSelected} />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={75}>
        <div className="h-full flex flex-col">
          <FileTopbar
            note={displayedNote}
            onTitleChange={handleTitleChange}
            onClose={() => {}}
            onDelete={() => {}}
            onShare={() => {}}
            onExport={() => {}}
          />
          <div className="flex-1 overflow-hidden">
            <SimpleEditor
              content={displayedNote?.content}
              onUpdate={handleContentUpdate}
            />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
