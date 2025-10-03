import { createFileRoute } from '@tanstack/react-router'
import PlayersContent from './-components/players-content'
import PlayersHeader from './-components/players-header'

export const Route = createFileRoute(
  '/_authed/campaigns/$dmUsername/$campaignSlug/players/',
)({
  component: PlayersPage,
})

function PlayersPage() {
  return (
    <div className="flex-1 p-6">
      <PlayersHeader />
      <PlayersContent />
    </div>
  )
}
