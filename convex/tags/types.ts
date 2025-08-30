import { Id } from "../_generated/dataModel";
import { Note } from "../notes/types";

export const TAG_TYPES = {
  Character: "Character",
  Location: "Location",
  Session: "Session",
  System: "System",
  Other: "Other",
} as const;

export type TagType = (typeof TAG_TYPES)[keyof typeof TAG_TYPES];

export type Tag = {
  _id: Id<"tags">;
  _creationTime: number;

  name: string;
  color: string;
  campaignId: Id<"campaigns">;
  type: TagType;
  updatedAt: number;
};

export const SYSTEM_TAGS = {
  shared: "Shared",
};

export interface TagNote extends Omit<Note, "tagId"> {
  tagName: string;
  tagColor: string;
  tagType: TagType;
  tagId: Id<"tags">;
}
