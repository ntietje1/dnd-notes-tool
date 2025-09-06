import React from "react";
import { useNotes } from "~/contexts/NotesContext";
import { Button } from "~/components/shadcn/ui/button";
import { BlockNoteView } from "@blocknote/shadcn";
import TagMenu from "./extensions/side-menu/tags/tag-menu";
import { SideMenuController } from "@blocknote/react";
import SelectionToolbar from "./extensions/selection-toolbar/selection-toolbar";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { api } from "convex/_generated/api";
import { BlockNoteSchema } from "@blocknote/core";
import { SideMenuRenderer } from "./extensions/side-menu/side-menu";
import { customInlineContentSpecs, type CustomBlockNoteEditor } from "~/lib/editor-schema";
import { Skeleton } from "~/components/shadcn/ui/skeleton";

const schema = BlockNoteSchema.create({
  inlineContentSpecs: customInlineContentSpecs,
});

export function NotesEditor() {
  const { noteId, note, debouncedUpdateNoteContent, createNote, status } = useNotes();

  const sync = useBlockNoteSync<CustomBlockNoteEditor>(
    api.prosemirrorSync,
    noteId ?? "",
    {
      editorOptions: {
        schema,
      },
    },
  );

  React.useEffect(() => {
    if (
      note &&
      !sync.editor &&
      !sync.isLoading &&
      "create" in sync &&
      sync.create
    ) {
      sync.create({
        content: note.content as any, // JSONContent[] from @tiptap/core
        type: "doc",
      });
    }
  }, [note, sync.editor, sync.isLoading, sync]);

  if (status === "error") {
    return <div>Error loading note</div>;
  }

  if (status === "pending") {
    return <NotesEditorSkeleton />;
  }

  if (!noteId) {
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
        <div className="h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
            <BlockNoteView
              editor={sync.editor as any} //TODO: fix this
              onChange={() => debouncedUpdateNoteContent(sync.editor.document)}
              theme="light"
              sideMenu={false}
              formattingToolbar={false}
            >
              <TagMenu editor={sync.editor} />
              <SideMenuController sideMenu={SideMenuRenderer} />
              <SelectionToolbar />
            </BlockNoteView>
          </div>
        </div>
      )}
    </div>
  );
}

function NotesEditorSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4">
        <div className="space-y-4">
          <Skeleton className="h-6 w-3/4"/>
          <Skeleton className="h-4 w-full"/>
          <Skeleton className="h-4 w-5/6"/>
          <Skeleton className="h-4 w-4/5"/>
        </div>
      </div>
    </div>
  );
}
