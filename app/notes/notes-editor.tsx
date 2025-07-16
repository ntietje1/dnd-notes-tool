"use client";

import { useNotes } from "@/contexts/NotesContext";
import { FileTopbar } from "@/components/file-topbar/topbar";
import { SimpleEditor } from "@/components/custom-tiptap-ui/editor/editor";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Note } from "@/convex/notes/types";
import { Id } from "@/convex/_generated/dataModel";

function ToolbarSkeleton() {
  return (
    <div className="tiptap-toolbar border-b" data-variant="fixed">
      <div className="flex items-center gap-4 px-2 min-h-[2.75rem]">
        <div className="w-175 h-7 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-8 border-b flex items-center px-4">
        <div className="h-5 w-48 bg-gray-200 animate-pulse rounded" />
      </div>
      <ToolbarSkeleton />
      <div className="flex-1 p-4">
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-3/4 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 rounded" />
          <div className="h-4 w-4/5 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function NotesEditor() {
  const {
    currentNoteId,
    selectedNote,
    updateNoteContent,
    updateNoteName: updateNoteTitle,
    isLoading: isDataLoading,
    createNote,
  } = useNotes();

  const { isLoading: isAuthLoading } = useConvexAuth();

  if (isAuthLoading || isDataLoading) {
    return <LoadingState />;
  }

  if (!currentNoteId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
        <p>Select a note or create a new one to get started</p>
        <Button variant="outline" onClick={() => createNote()}>
          Create new note
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <FileTopbar
        note={selectedNote ?? placeHolderNote}
        onTitleChange={(title) => updateNoteTitle(currentNoteId, title)}
      />
      <div className="flex-1 overflow-hidden">
        <SimpleEditor
          note={selectedNote ?? placeHolderNote}
          onUpdate={({ editor }) => updateNoteContent(editor)}
          className="h-full"
        />
      </div>
    </div>
  );
}

const placeHolderNote: Note = {
  _id: "placeholder" as Id<"notes">,
  _creationTime: 0,
  userId: "placeholder",
  updatedAt: 0,
  type: "notes",
  content: {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: " " }],
      },
    ],
  },
  name: " ",
  hasSharedContent: false,
};
