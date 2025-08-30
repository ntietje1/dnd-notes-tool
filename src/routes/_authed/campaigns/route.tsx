import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/campaigns')({
  component: CampaignsLayout,
})

function CampaignsLayout() {
  return (
    <Outlet />
  )
}