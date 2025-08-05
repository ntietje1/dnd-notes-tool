"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sword, Shield, Users, Loader2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

interface JoinCampaignPageProps {
  params: {
    dmUsername: string;
    campaignSlug: string;
  };
}

export default function JoinCampaignPage({ params }: JoinCampaignPageProps) {
  const { dmUsername, campaignSlug } = params;
  const router = useRouter();
  const { signIn } = useAuthActions();

  const campaign = useQuery(api.campaigns.queries.getCampaignBySlug, {
    dmUsername: dmUsername,
    slug: campaignSlug,
  });

  const currentUser = useQuery(api.users.queries.getUserProfile);

  if (!currentUser) {
    throw new Error("User profile not found");
  }
  const joinCampaign = useMutation(api.campaigns.mutations.joinCampaign);

  useEffect(() => {
    // If user is authenticated and campaign exists, automatically join
    if (currentUser && campaign) {
      handleJoinCampaign();
    }
  }, [currentUser, campaign]);

  const handleJoinCampaign = async () => {
    if (!campaign) return;

    try {
      await joinCampaign({ slug: campaignSlug, dmUsername: dmUsername });
      router.push(`/notes/${campaign._id}`);
    } catch (error) {
      console.error("Failed to join campaign:", error);
    }
  };

  const handleSignIn = () => {
    signIn("github", {
      redirectTo: `/campaigns/${dmUsername}/${campaignSlug}/join`,
    });
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="p-3 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-800">Campaign Not Found</CardTitle>
            <CardDescription>
              The campaign link you're trying to access doesn't exist or has
              been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => router.push("/campaigns")}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Browse Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Sword className="h-8 w-8 text-amber-600" />
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Shield className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-slate-800">Join Campaign</CardTitle>
            <CardDescription>
              You've been invited to join <strong>{campaign.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-2">
                {campaign.name}
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                {campaign.description || "No description provided"}
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4" />
                <span>Campaign by {campaign.dmUserId}</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-600 mb-4">
                Sign in to join this campaign and start your adventure!
              </p>
              <Button
                onClick={handleSignIn}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Sign In to Join Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Sword className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Joining Campaign...</CardTitle>
          <CardDescription>
            You're being added to <strong>{campaign.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto" />
        </CardContent>
      </Card>
    </div>
  );
}
