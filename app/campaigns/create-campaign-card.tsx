"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export function CreateCampaignCard() {
  const handleClick = () => {
    // This will be handled by the CreateCampaignDialog component
    const event = new CustomEvent("openCreateCampaign");
    window.dispatchEvent(event);
  };

  return (
    <Card
      onClick={handleClick}
      className="border-2 border-dashed border-amber-300 hover:border-amber-400 transition-all duration-200 cursor-pointer group bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-lg"
    >
      <CardContent className="flex flex-col items-center justify-center h-64 text-center">
        <div className="p-4 bg-amber-100 rounded-full mb-4 group-hover:bg-amber-200 transition-colors">
          <Plus className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          Create New Campaign
        </h3>
        <p className="text-slate-600">Start a new adventure with your party</p>
      </CardContent>
    </Card>
  );
}
