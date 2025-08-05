"use client";

import { TagType } from "@/convex/tags/types";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { EditableName } from "../../sidebar-item/editable-name";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NoteButton } from "../../sidebar-note/note-button";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Note } from "@/convex/notes/types";
import { useNotes } from "@/contexts/NotesContext";

interface SessionSystemFolderProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
}

interface TagNote extends Note {
  tagName: string;
  tagColor: string;
  tagType: TagType;
}

export const SessionSystemFolder = ({
  isExpanded,
  onToggleExpanded,
  renamingId,
  setRenamingId,
}: SessionSystemFolderProps) => {
  const { updateNoteName, selectNote, deleteNote, currentNote, currentCampaign } = useNotes();
  
  const queryResult = useQuery(api.notes.queries.getTagNotePages, currentCampaign ? {
    tagType: "Session",
    campaignId: currentCampaign._id,
  } : "skip");
  
  const tagNotePages = queryResult ?? [];
  const hasItems = tagNotePages.length > 0;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      {/* Non-draggable system folder - no context menu for sessions */}
      <Button
        variant="ghost"
        className="w-full flex-1 justify-start gap-2 h-8 min-w-0 p-0"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center gap-1 min-w-0 w-full">
          <div className="flex items-center h-4 w-3 shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-2 w-2 pl-1 pr-0.5" />
            ) : (
              <ChevronRight className="h-2 w-2 pl-1 pr-0.5" />
            )}
          </div>
          <Calendar className="h-4 w-4 shrink-0" />
          <EditableName
            initialName="Sessions"
            defaultName="Sessions"
            isRenaming={false}
            onFinishRename={() => {}}
          />
        </div>
      </Button>
      <CollapsibleContent>
        <div className="relative pl-4">
          {/* Vertical line */}
          {hasItems && (
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-muted-foreground/10" />
          )}
          {/* Render non-draggable notes */}
          {tagNotePages.map((note: TagNote) => (
            <div key={note._id} className="flex w-full min-w-0">
              <NoteButton
                note={note}
                isRenaming={renamingId === note._id}
                // onStartRename={() => setRenamingId(note._id)}
                onFinishRename={(name) => {
                  updateNoteName(note._id, name);
                  setRenamingId(null);
                }}
                isSelected={currentNote?._id === note._id}
                onNoteSelected={() => selectNote(note._id)}
                // onDelete={() => deleteNote(note._id)}
              />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};