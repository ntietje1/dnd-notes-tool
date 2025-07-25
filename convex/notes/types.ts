import { Id } from "../_generated/dataModel";
import { CustomBlock } from "../../lib/tags";

// Only include actual database table types
export type SidebarItemType = "notes" | "folders";

// Generic type for all sidebar items
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

export type Note = SidebarItem<"notes"> & {
  content: CustomBlock[];
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
