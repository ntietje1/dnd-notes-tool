import { Id } from "../_generated/dataModel";
import { TAG_TYPES } from "../tags/types";

export type Location = {
  _id: Id<"locations">;
  _creationTime: number;
  name: string;
  description?: string;
  color: string;
  campaignId: Id<"campaigns">;
  tagId: Id<"tags">;
  createdBy: string;
  updatedAt: number;
};

export type LocationWithTag = Location & {
  tag: {
    _id: Id<"tags">;
    name: string;
    color: string;
    type: typeof TAG_TYPES.Location;
  };
};
