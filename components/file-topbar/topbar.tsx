"use client";

import { Note } from "@/convex/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, MoreVertical, Download, Trash2, Share, Users } from "lucide-react";
import { UNTITLED_NOTE_TITLE } from "@/convex/types";
import { useCallback, useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface FileTopbarProps {
  note: Note | null;
  onTitleChange: (title: string) => void;
  onClose?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onExport?: () => void;
}

export function FileTopbar({
  note,
  onTitleChange,
  onClose,
  onDelete,
  onShare,
  onExport,
}: FileTopbarProps) {
  const [title, setTitle] = useState(note?.name || UNTITLED_NOTE_TITLE);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateNote = useMutation(api.notes.updateNote);

  useEffect(() => {
    setTitle(note?.name || UNTITLED_NOTE_TITLE);
  }, [note?.name]);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      onTitleChange(newTitle);
    },
    [onTitleChange],
  );

  const handleTitleSubmit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const toggleShared = useCallback(async () => {
    if (note) {
      // do nothing for now
    }
  }, [note, updateNote]);

  return (
    <div className="flex items-center justify-between px-4 h-12 border-b">
      <div className="flex items-center gap-2 flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleTitleSubmit();
              }
            }}
            className="bg-transparent border-b border-transparent outline-none focus:ring-0 px-2 flex"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-left border-b border-transparent hover:border-gray-300 flex px-2"
          >
            {title}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleShared}>
          <Users className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onShare && (
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
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
