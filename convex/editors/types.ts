import { Id } from "../_generated/dataModel";

export type Editor = {
  _id: Id<"editor">;
  _creationTime: number;

  userId: Id<"users">;
  activeNoteId: Id<"notes"> | null;
};
