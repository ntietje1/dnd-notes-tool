import { Id } from "../_generated/dataModel";
import { CustomBlock } from "../../lib/tags";

export const NOTES_TYPE = "notes" as const;
export const FOLDERS_TYPE = "folders" as const;

export type SidebarItemType = typeof NOTES_TYPE | typeof FOLDERS_TYPE;

export type SidebarItem<T extends SidebarItemType> = {
  _id: Id<T>;
  _creationTime: number;

  name?: string;
  userId: string;
  campaignId: Id<"campaigns">;
  parentFolderId?: Id<"folders">;
  updatedAt: number;
  type: T;
};

export type Note = SidebarItem<typeof NOTES_TYPE>;

export const UNTITLED_NOTE_TITLE = "Untitled Note";
export const UNTITLED_FOLDER_NAME = "Untitled Folder";

export type Folder = SidebarItem<typeof FOLDERS_TYPE>;

export interface FolderNode extends Folder {
  type: typeof FOLDERS_TYPE;
  children: AnySidebarItem[];
}

// Union type of all possible sidebar items (doesn't include Folder, as FolderNodes are used instead)
export type AnySidebarItem = Note | FolderNode;

export type RawSidebarData = {
  folders: Folder[];
  notes: Note[];
};

export type Block = {
  _id: Id<"blocks">;
  _creationTime: number;
  noteId: Id<"notes">;
  blockId: string;
  position?: number;
  content: CustomBlock;
  isTopLevel: boolean;
  campaignId: Id<"campaigns">;
  updatedAt: number;
};

export type BlockTag = {
  _id: Id<"blockTags">;
  _creationTime: number;
  campaignId: Id<"campaigns">;
  blockId: Id<"blocks">;
  tagId: Id<"tags">;
  createdAt: number;
};

export type NoteWithContent = Note & { content: CustomBlock[] };
