import { JSONContent } from "@tiptap/react";
import { Id } from "./_generated/dataModel";

// Only include actual database table types
export type SidebarItemType = "notes" | "folders";

// Generic type for all sidebar items
export type SidebarItem<T extends SidebarItemType> = {
  _id: Id<T>;
  _creationTime: number;

  name?: string;
  userId: string; //TODO: figure out why this isnt working as an Id<"users">
  parentFolderId?: Id<"folders">;
  updatedAt: number;
  type: T;
};

export type Note = SidebarItem<"notes"> & {
  content: JSONContent;
  hasSharedContent?: boolean;
};

export const UNTITLED_NOTE_TITLE = "Untitled Note";
export const UNTITLED_FOLDER_NAME = "Untitled Folder";

export type Folder = SidebarItem<"folders">;

// FolderNode extends Folder but adds tree structure properties
export interface FolderNode extends Folder {
  type: "folders";
  children: AnySidebarItem[];
}

// Union type of all possible sidebar items (doesn't include Folder, as FolderNodes are used instead)
export type AnySidebarItem = Note | FolderNode;

export type RawSidebarData = {
  folders: Folder[];
  notes: Note[];
};

export type Editor = {
  _id: Id<"editor">;
  _creationTime: number;

  userId: Id<"users">;
  activeNoteId: Id<"notes"> | null;
};
