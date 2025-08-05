import { Id } from "../_generated/dataModel";

export type TagType = "Character" | "Location" | "Session" | "System" | "Other";

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
