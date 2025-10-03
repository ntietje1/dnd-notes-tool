import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authed/campaigns/$dmUsername/$campaignSlug/locations/routes',
)({
  component: LocationsLayout,
})

function LocationsLayout() {
  return <Outlet />
}
