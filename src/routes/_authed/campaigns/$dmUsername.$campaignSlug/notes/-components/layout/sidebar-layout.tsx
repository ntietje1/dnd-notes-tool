import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/components/shadcn/ui/resizable";
import { FileSidebar } from "../editor/file-sidebar/sidebar";
import { SidebarHeader } from "../editor/sidebar-header/sidebar-header";


export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={10}>
          <SidebarHeader />
          <FileSidebar />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={80} minSize={25}>
          {children}
        </ResizablePanel>
  </ResizablePanelGroup>
  );
}