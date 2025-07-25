"use client";

import { useNotes } from "@/contexts/NotesContext";
import { Button } from "@/components/ui/button";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { BlockNoteSchema } from "@blocknote/core";
import { api } from "@/convex/_generated/api";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import React from "react";
import { debounce } from "lodash-es";
import {
  CustomBlock,
  CustomBlockNoteEditor,
  customInlineContentSpecs,
} from "@/app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";
import TagMenu from "./extensions/tags/tag-menu";

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
    debounce((content: CustomBlock[]) => {
      updateNoteContent(content);
    }, 1250),
  ).current;

  const schema = React.useMemo(
    () =>
      BlockNoteSchema.create({
        inlineContentSpecs: customInlineContentSpecs,
      }),
    [],
  );

  const sync = useBlockNoteSync<CustomBlockNoteEditor>(
    api.prosemirrorSync,
    currentNote?._id ?? "",
    {
      editorOptions: {
        schema,
      },
    },
  );

  React.useEffect(() => {
    if (currentNote && !sync.editor && !sync.isLoading && sync.create) {
      sync.create(currentNote.content);
    }
  }, [currentNote, sync.editor, sync.isLoading]);

  if (isLoading || sync.isLoading) {
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
          className="h-full overflow-y-auto pt-4"
          editor={sync.editor}
          onChange={() => debouncedUpdateNoteContent(sync.editor.document)}
          theme="light"
        >
          <TagMenu editor={sync.editor} />
        </BlockNoteView>
      )}
    </div>
  );
}
