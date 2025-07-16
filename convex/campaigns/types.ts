import { Id } from "../_generated/dataModel";

export type Campaign = {
  _id: Id<"campaigns">;
  _creationTime: number;

  userId: string;
  name: string;
  description?: string;
  updatedAt: number;
  token: string;
};
