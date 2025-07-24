import { Id } from "../_generated/dataModel";

export type TagType = "character" | "location" | "session" | "custom";

export type Tag = {
  _id: Id<"tags">;
  _creationTime: number;

  name: string;
  color: string;
  campaignId: Id<"campaigns">;
  type: TagType;
  updatedAt: number;
};

export type NoteTag = {
  _id: Id<"noteTags">;
  _creationTime: number;

  noteId: Id<"notes">;
  tagId: Id<"tags">;
  blockId?: string;
  position?: number;
};
