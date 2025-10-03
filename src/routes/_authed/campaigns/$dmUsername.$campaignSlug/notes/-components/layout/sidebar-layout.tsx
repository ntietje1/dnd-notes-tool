import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/shadcn/ui/resizable'
import { FileSidebar } from '../editor/file-sidebar/sidebar'
import { SidebarHeader } from '../editor/sidebar-header/sidebar-header'
import { FileSidebarProvider } from '~/contexts/FileSidebarContext'

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full"
      autoSaveId="notes-sidebar-layout"
    >
      <ResizablePanel defaultSize={20} minSize={10} className="flex flex-col">
        <FileSidebarProvider>
          <SidebarHeader />
          <FileSidebar />
        </FileSidebarProvider>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={80} minSize={25}>
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
