"use client";

import { useNotes } from "@/contexts/NotesContext";
import { Button } from "@/components/ui/button";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { BlockNoteEditor, Block } from "@blocknote/core";
import { api } from "@/convex/_generated/api";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import React from "react";
import { debounce } from "lodash-es";

// Recursively sanitize BlockNote content to remove undefined values
function sanitizeBlockContent(content: any): any {
  if (!content || typeof content !== "object") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map(sanitizeBlockContent)
      .filter((item) => item !== undefined);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(content)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeBlockContent(value);
    }
  }
  return sanitized;
}

function LoadingState() {
  return (
    <div className="flex flex-col h-full">
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
  const { currentNote, updateNoteContent, createNote, isLoading } = useNotes();

  const debouncedUpdateNoteContent = React.useRef(
    debounce((content: Block[]) => {
      const sanitizedContent = sanitizeBlockContent(content);
      updateNoteContent(sanitizedContent);
    }, 1250),
  ).current;

  const sync = useBlockNoteSync<BlockNoteEditor>(
    api.prosemirrorSync,
    currentNote?._id ?? "",
  );

  // Automatically create editor if we have a currentNote but no editor
  React.useEffect(() => {
    if (currentNote && !sync.editor && !sync.isLoading) {
      sync.create(currentNote.content);
    }
  }, [currentNote, sync]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!currentNote) {
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
    <div className="h-full flex flex-col bg-white">
      {sync.editor && (
        <BlockNoteView
          className="h-full overflow-y-auto"
          editor={sync.editor}
          onChange={() => debouncedUpdateNoteContent(sync.editor.document)}
          theme="light"
        />
      )}
    </div>
  );
}
