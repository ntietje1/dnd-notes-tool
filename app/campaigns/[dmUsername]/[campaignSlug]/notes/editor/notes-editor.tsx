"use client";

import { useNotes } from "@/contexts/NotesContext";
import { Button } from "@/components/ui/button";
import { BlockNoteView } from "@blocknote/shadcn";
import { BlockNoteSchema } from "@blocknote/core";
import { api } from "@/convex/_generated/api";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import React from "react";
import {
  CustomBlockNoteEditor,
  customInlineContentSpecs,
} from "@/app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";
import TagMenu from "./extensions/tags/tag-menu";

const schema = BlockNoteSchema.create({
  inlineContentSpecs: customInlineContentSpecs,
});

export default function NotesEditor() {
  const { currentNote, debouncedUpdateNoteContent, createNote } = useNotes();

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
    if (
      currentNote &&
      !sync.editor &&
      !sync.isLoading &&
      "create" in sync &&
      sync.create
    ) {
      sync.create(currentNote.content);
    }
  }, [currentNote, sync.editor, sync.isLoading, sync]);

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
