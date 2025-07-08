"use client";

import { useRouter } from "next/navigation";
import { Note } from "@/convex/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X, MoreVertical, Download, Trash2, Share } from "lucide-react";
import { UNTITLED_NOTE_TITLE } from "@/convex/types";
import { useCallback, useState, useEffect } from "react";

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
  const router = useRouter();
  const [localTitle, setLocalTitle] = useState(note?.title ?? "");

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/");
    }
  };

  // Sync local title with database title
  useEffect(() => {
    setLocalTitle(note?.title ?? "");
  }, [note?.title]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setLocalTitle(newTitle);
      onTitleChange(newTitle);
    },
    [onTitleChange],
  );

  return (
    <div className="h-8 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={localTitle}
          onChange={handleTitleChange}
          className="text-lg font-medium truncate bg-transparent border-none outline-none focus:ring-0"
          placeholder={UNTITLED_NOTE_TITLE}
        />
      </div>

      <div className="flex items-center gap-2">
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

        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
