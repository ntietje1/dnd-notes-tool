import { Id } from "../_generated/dataModel";

export type Editor = {
  _id: Id<"editor">;
  _creationTime: number;

  userId: Id<"users">;
  campaignId: Id<"campaigns">;
  activeNoteId: Id<"notes"> | null;
};
