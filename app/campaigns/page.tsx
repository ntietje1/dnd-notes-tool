import type React from "react";
import CreateCampaignDialog from "./create-campaign-dialog";
import { CampaignsHeader } from "./campaigns-header";
import { CampaignsList } from "./campaigns-list";
import { CampaignsFooter } from "./campaigns-footer";

export default function CampaignDashboard() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="min-h-full w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <CampaignsHeader />
          <CampaignsList />
          <CampaignsFooter />
          <CreateCampaignDialog />
        </div>
      </div>
    </div>
  );
}
