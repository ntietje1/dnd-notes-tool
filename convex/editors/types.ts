import { Id } from "../_generated/dataModel";

export type SortOrder = "alphabetical" | "dateCreated" | "dateModified";
export type SortDirection = "asc" | "desc";

export type Editor = {
  _id: Id<"editor">;
  _creationTime: number;

  userId: Id<"users">;
  sortOrder: SortOrder;
  sortDirection: SortDirection;
};
