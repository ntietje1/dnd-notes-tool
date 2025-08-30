import { createFileRoute } from '@tanstack/react-router'
import { CampaignsHeader } from './-components/campaigns-header';
import { CampaignsContent } from './-components/campaigns-content';
import { CampaignsFooter } from './-components/campaigns-footer';

export const Route = createFileRoute('/_authed/campaigns/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col flex-1 p-8">
      <CampaignsHeader />
      <CampaignsContent />
      <CampaignsFooter />
    </div>
  );
}
