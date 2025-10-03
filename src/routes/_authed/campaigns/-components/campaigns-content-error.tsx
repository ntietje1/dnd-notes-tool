import { AlertTriangle } from '~/lib/icons'
import { ContentGrid } from '~/components/content-grid-page/content-grid'
import { EmptyState } from '~/components/content-grid-page/empty-state'

export const CampaignsContentError = () => {
  return (
    <ContentGrid>
      <EmptyState
        icon={AlertTriangle}
        title="Error Loading Campaigns"
        description="There was an error loading your campaigns. Please try refreshing the page. If the problem persists, contact support."
        action={{
          label: 'Refresh Page',
          onClick: () => window.location.reload(),
        }}
        className="col-span-full md:col-span-2 lg:col-span-3 max-w-2xl mx-auto"
      />
    </ContentGrid>
  )
}
