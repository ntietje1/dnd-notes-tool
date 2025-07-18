import { Id } from "../_generated/dataModel";
import { Note } from "../notes/types";

export type Campaign = {
  _id: Id<"campaigns">;
  _creationTime: number;

  userId: string;
  name: string;
  description?: string;
  updatedAt: number;
  token: string;
  notes?: Note[];
  playerCount: number;
  status: "Active" | "Inactive";
};

export type UserCampaign = Campaign & {
  role: "DM" | "Player";
};
