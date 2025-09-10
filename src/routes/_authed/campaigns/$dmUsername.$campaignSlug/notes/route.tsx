import { createFileRoute, Outlet } from '@tanstack/react-router'
import { NotesProvider } from '~/contexts/NotesContext'
import { SidebarLayout } from './-components/layout/sidebar-layout'
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { NotesPageLayout } from './-components/page/index'
import { NotesEditor } from './-components/editor/notes-editor';

export const Route = createFileRoute('/_authed/campaigns/$dmUsername/$campaignSlug/notes')({
  component: NotesLayout,
})

function NotesLayout() {
  return (
    <NotesProvider>
      <div className="flex-1 min-h-0">
        <SidebarLayout>
          <NotesPageLayout>
            <NotesEditor />
          </NotesPageLayout>
        </SidebarLayout>
      </div>
    </NotesProvider>
  )
}