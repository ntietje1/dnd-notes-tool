import { JSONContent } from "@tiptap/react";
import { Id } from "./_generated/dataModel";

export type Note = {
  _id: Id<"notes">;
  _creationTime: number;

  userId: Id<"users">;
  title?: string;
  content: JSONContent;
  folderId?: Id<"folders">;
  hasSharedContent?: boolean;
  updatedAt: number;
};

export const UNTITLED_NOTE_TITLE = "Untitled Note";
export const UNTITLED_FOLDER_NAME = "Untitled Folder";

export type Folder = {
  _id: Id<"folders">;
  _creationTime: number;

  userId: Id<"users">;
  name: string;
  updatedAt: number;
};

export type SidebarData = {
  folders: Folder[];
  notes: Note[];
};

export type SaveNoteArgs = {
  noteId: Id<"notes">;
  content?: JSONContent;
  title?: string;
  folderId?: Id<"folders">;
};
