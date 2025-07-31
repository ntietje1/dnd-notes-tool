import { Id } from "../_generated/dataModel";

export type TagType =
  | "character"
  | "location"
  | "session"
  | "shared"
  | "custom";

export type Tag = {
  _id: Id<"tags">;
  _creationTime: number;

  name: string;
  color: string;
  campaignId: Id<"campaigns">;
  type: TagType;
  mutable: boolean;
  updatedAt: number;
};
