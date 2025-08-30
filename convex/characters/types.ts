import { Id } from "../_generated/dataModel";
import { TAG_TYPES } from "../tags/types";

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
    type: typeof TAG_TYPES.Character;
  };
};
