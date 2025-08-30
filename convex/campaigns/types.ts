import { Id } from "../_generated/dataModel";
import { UserProfile } from "../users/types";

export const CAMPAIGN_STATUS = {
  Active: "Active",
  Inactive: "Inactive",
} as const;

export type CampaignStatus =
  (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export const CAMPAIGN_MEMBER_ROLE = {
  DM: "DM",
  Player: "Player",
} as const;

export type CampaignMemberRole =
  (typeof CAMPAIGN_MEMBER_ROLE)[keyof typeof CAMPAIGN_MEMBER_ROLE];

export const CAMPAIGN_MEMBER_STATUS = {
  Accepted: "Accepted",
  Pending: "Pending",
  Rejected: "Rejected",
  Removed: "Removed",
} as const;

export type CampaignMemberStatus =
  (typeof CAMPAIGN_MEMBER_STATUS)[keyof typeof CAMPAIGN_MEMBER_STATUS];

export type Campaign = {
  _id: Id<"campaigns">;
  _creationTime: number;

  dmUserProfile: UserProfile;
  name: string;
  description?: string;
  updatedAt: number;
  playerCount: number;
  slug: string;
  status: CampaignStatus;
  noteCount?: number;
};

export type CampaignMember = {
  _id: Id<"campaignMembers">;
  _creationTime: number;

  userProfile: UserProfile
  campaignId: Id<"campaigns">;
  role: CampaignMemberRole;
  status: CampaignMemberStatus;
};

export type CampaignWithMembership = {
  campaign: Campaign;
  member: CampaignMember;
};
