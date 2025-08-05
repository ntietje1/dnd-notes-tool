"use client";

import React, { useMemo } from "react";
import { useNotes } from "@/contexts/NotesContext";
import { Button } from "@/components/ui/button";
import { BlockNoteView } from "@blocknote/shadcn";
import { CustomBlockNoteEditor, customInlineContentSpecs } from "../../../../../../lib/tags";
import TagMenu from "./extensions/side-menu/tags/tag-menu";
import { SideMenuController } from "@blocknote/react";
import SelectionToolbar from "./extensions/selection-toolbar/selection-toolbar";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { api } from "@/convex/_generated/api";
import { BlockNoteSchema } from "@blocknote/core";
import { SideMenuRenderer } from "./extensions/side-menu/side-menu";

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

  const sideMenuRenderer = useMemo(() => SideMenuRenderer(sync.editor), [sync.editor]);

  React.useEffect(() => {
    if (
      currentNote &&
      !sync.editor &&
      !sync.isLoading &&
      "create" in sync &&
      sync.create
    ) {
      sync.create({
        content: currentNote.content as any, // JSONContent[] from @tiptap/core
        type: "doc",
      });
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
          sideMenu={false}
          formattingToolbar={false}
        >
          <TagMenu editor={sync.editor} />
          <SideMenuController
            floatingOptions={{
              onOpenChange: (open) => {
                if (!open) {
                  sync.editor?.sideMenu?.unfreezeMenu();
                }
              },
            }}
            sideMenu={sideMenuRenderer}
          />
          <SelectionToolbar />
        </BlockNoteView>
      )}
    </div>
  );
}
