import { Id } from "../_generated/dataModel";

export type Character = {
  _id: Id<"characters">;
  _creationTime: number;
  name: string;
  description?: string;
  color: string;
  campaignId: Id<"campaigns">;
  tagId: Id<"tags">;
  createdBy: string;
  updatedAt: number;
};

export type CharacterWithTag = Character & {
  tag: {
    _id: Id<"tags">;
    name: string;
    color: string;
    // kept for UI convenience; derived in queries
    type: "Character";
  };
};
