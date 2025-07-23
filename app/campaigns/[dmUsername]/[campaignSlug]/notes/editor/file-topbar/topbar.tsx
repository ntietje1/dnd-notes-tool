"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, MoreVertical } from "lucide-react";
import { UNTITLED_NOTE_TITLE } from "@/convex/notes/types";
import { useCallback, useState, useEffect, useRef } from "react";
import { useNotes } from "@/contexts/NotesContext";

function ToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 h-12 border-b">
      <div className="flex items-center gap-2 flex-1 pr-4">
        <div className="h-6 w-64 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function FileTopbar() {
  const { currentNote, updateNoteName, selectNote, isLoading } = useNotes();
  const [title, setTitle] = useState(currentNote?.name ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(currentNote?.name ?? "");
  }, [currentNote?.name]);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      if (currentNote) {
        updateNoteName(currentNote._id, newTitle);
      }
    },
    [currentNote, updateNoteName],
  );

  const handleTitleSubmit = useCallback(() => {
    setIsEditing(false);
  }, []);

  if (isLoading) {
    return <ToolbarSkeleton />;
  }

  return (
    <div className="flex items-center justify-between px-4 h-12 border-b bg-white">
      {currentNote && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 flex-1">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={title}
                placeholder={UNTITLED_NOTE_TITLE}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTitleSubmit();
                  }
                }}
                className="bg-transparent border-b border-transparent outline-none focus:ring-0 px-2 flex w-full"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-left border-b border-transparent hover:border-gray-300 flex px-2"
              >
                {title || (
                  <span className="opacity-85">{UNTITLED_NOTE_TITLE}</span>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* <Button variant="ghost" size="icon" onClick={toggleShared}>
              <Users className="h-4 w-4" />
            </Button> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* {onShare && (
                  <DropdownMenuItem onClick={onShare}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                )}
                {onExport && (
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )} */}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => selectNote(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
