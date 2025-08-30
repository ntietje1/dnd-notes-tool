import { createFileRoute, Outlet } from '@tanstack/react-router'
import { NotesProvider } from '~/contexts/NotesContext'
import { SidebarLayout } from './-components/layout/sidebar-layout'
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

export const Route = createFileRoute('/_authed/campaigns/$dmUsername/$campaignSlug/notes')({
  component: NotesLayout,
})

function NotesLayout() {
  return (
    <NotesProvider>
      <div className="flex-1">
        <SidebarLayout>
          <Outlet />
        </SidebarLayout>
      </div>
    </NotesProvider>
  )
}