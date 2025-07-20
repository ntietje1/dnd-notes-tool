import { Id } from "../_generated/dataModel";
import { Note } from "../notes/types";

export type Campaign = {
  _id: Id<"campaigns">;
  _creationTime: number;

  userId: string;
  name: string;
  description?: string;
  updatedAt: number;
  notes?: Note[];
  playerCount: number;
  status: "Active" | "Inactive";
};

export type CampaignSlug = {
  campaignId: Id<"campaigns">;
  slug: string;
  updatedAt: number;
  username: string;
};

export type UserCampaign = Campaign & {
  campaignSlug: CampaignSlug;
  role: "DM" | "Player";
};