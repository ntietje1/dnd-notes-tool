import { Button } from "~/components/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import { X, MoreVertical } from "~/lib/icons";
import { useCallback, useState, useEffect, useRef } from "react";
import { UNTITLED_NOTE_TITLE } from "convex/notes/types";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { useCampaign } from "~/contexts/CampaignContext";
import { useCurrentNote } from "~/hooks/useCurrentNote";
import { useNoteActions } from "~/hooks/useNoteActions";

export function FileTopbar() {
  const { dmUsername, campaignSlug } = useCampaign();
  const { note, selectNote } = useCurrentNote();
  const { renameNote } = useNoteActions();
  const [title, setTitle] = useState(note.data?.name ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(note.data?.name ?? "");
  }, [note.data?.name]);

  const handleTitleSubmit = useCallback(() => {
    setIsEditing(false);
    if (note.data) {
      renameNote(note.data._id, title);
    }
  }, [note, title, renameNote]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  if (note.status === "pending") {
    return <TopbarLoading />;
  }

  if (!note.data) {
    return <TopbarEmpty />;
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 h-12 border-b bg-white w-full">
      <div className="flex items-center justify-between w-full">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            placeholder={UNTITLED_NOTE_TITLE}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleTitleSubmit();
              }
            }}
            className="bg-transparent border-b border-transparent outline-none focus:ring-0 px-2 w-full"
            autoFocus
          />
        ) : (
          <div className="truncate">
            <button
              onClick={() => setIsEditing(true)}
              className="text-left border-b border-transparent hover:border-gray-300 px-2 max-w-full truncate"
            >
              {title || (
                <span className="opacity-85">{UNTITLED_NOTE_TITLE}</span>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
              variant="ghost"
              size="icon"
              onClick={() => selectNote(null)}
              asChild
            >
            <Link to="/campaigns/$dmUsername/$campaignSlug/notes" params={{ dmUsername, campaignSlug }}>
              <X className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function TopbarLoading() {
  return (
    <div className="border-b p-2 h-12">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

function TopbarEmpty() {
  return (
    <div className="flex items-center justify-between px-4 py-2 h-12 border-b bg-white w-full">
      <div className="flex items-center justify-between w-full h-12"/>
    </div>
  );
}