import { Id } from "../_generated/dataModel";

export type Character = {
  _id: Id<"characters">;
  _creationTime: number;

  name: string;
  description: string;
  image: string;
  campaignId: Id<"campaigns">;
};
