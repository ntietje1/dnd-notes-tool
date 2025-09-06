import { Id } from "../_generated/dataModel";
import { Note } from "../notes/types";

export const CATEGORY_KIND = {
  SystemManaged: "system_managed", // both category and tags under it are immutable to users.
  SystemCore: "system_core", // immutable category, but tags under them are user-mutable.
  User: "user", // both category and tags under it are user mutable
} as const;

export const SYSTEM_TAG_CATEGORY_NAMES = {
  Character: "character",
  Location: "location",
  Session: "session",
  SharedAll: "shared: all",
} as const;

export type CategoryKind = (typeof CATEGORY_KIND)[keyof typeof CATEGORY_KIND];

export type TagCategory = {
  _id: Id<"tagCategories">;
  _creationTime: number;

  name: string;
  kind: CategoryKind;
  campaignId: Id<"campaigns">;
  updatedAt: number;
};

export type Tag = {
  _id: Id<"tags">;
  _creationTime: number;

  name: string;
  color: string;
  description?: string;
  campaignId: Id<"campaigns">;
  noteId?: Id<"notes">;
  categoryId: Id<"tagCategories">;
  memberId?: Id<"campaignMembers">;
  createdBy: string;
  updatedAt: number;
};

export type TagWithCategory = Tag & {
  category: TagCategory;
};

export interface TagNote extends Omit<Note, "tagId"> {
  tagName: string;
  tagColor: string;
  categoryId: Id<"tagCategories">;
  categoryName?: string;
  tagId: Id<"tags">;
}
