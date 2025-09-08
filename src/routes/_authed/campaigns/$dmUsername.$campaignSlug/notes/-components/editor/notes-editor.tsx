import { BlockNoteView } from "@blocknote/shadcn";
import { BlockNoteSchema } from "@blocknote/core";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
import { SideMenuController, useCreateBlockNote } from "@blocknote/react";
import { Button } from "~/components/shadcn/ui/button";
import { useNotes } from "~/contexts/NotesContext";
import TagMenu from "./extensions/side-menu/tags/tag-menu";
import { SideMenuRenderer } from "./extensions/side-menu/side-menu";
import SelectionToolbar from "./extensions/selection-toolbar/selection-toolbar";
import { customInlineContentSpecs } from "~/lib/editor-schema";

interface NotesEditorProps {
  noteId: string;
}

const schema = BlockNoteSchema.create({ inlineContentSpecs: customInlineContentSpecs });

export function NotesEditor({ noteId }: NotesEditorProps) {
  const { note, debouncedUpdateNoteContent, status } = useNotes();

  const hasContent = note?.content && note?.content.length > 0;

  const editor = useCreateBlockNote(
    hasContent ? {
      initialContent: note.content,
      schema
    } : {
      schema
    },
    [noteId]
  );

  if (note?._id !== noteId) {
    return <></>;
  }

  if (status === "pending") {
    return <NotesEditorSkeleton />;
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-6">
        <BlockNoteView
          editor={editor}
          onChange={() => debouncedUpdateNoteContent(editor.document)}
          theme="light"
          sideMenu={false}
          formattingToolbar={false}
        >
          <TagMenu editor={editor} />
          <SideMenuController sideMenu={SideMenuRenderer} />
          <SelectionToolbar />
        </BlockNoteView>
      </div>
    </div>
  );
}

export function NotesEditorEmptyContent() {
  const { createNote } = useNotes();

  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
      <p>Select a note or create a new one to get started</p>
      <Button variant="outline" onClick={() => createNote()}>
        Create new note
      </Button>
    </div>
  );
}

export function NotesEditorSkeleton() {
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
