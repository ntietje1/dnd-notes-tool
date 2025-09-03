import { Id } from "../_generated/dataModel";
import { Note } from "../notes/types";

export const CATEGORY_KIND = {
  // Core categories: immutable category metadata, but tags under them are user-manageable.
  Core: "core",
  // Managed categories: both category and tags under it are system-managed and immutable to users.
  SystemManaged: "system_managed",
  // User-created categories.
  User: "user",
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
  createdBy: string;
  updatedAt: number;
};

export const SYSTEM_TAGS = {
  shared: "Shared",
};

export interface TagNote extends Omit<Note, "tagId"> {
  tagName: string;
  tagColor: string;
  categoryId: Id<"tagCategories">;
  // Optional convenience field when denormalized
  categoryName?: string;
  tagId: Id<"tags">;
}
