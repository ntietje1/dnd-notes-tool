import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { NotesEditor } from "./notes-content";
import { NotesProvider } from "@/contexts/NotesContext";
import { FileSidebar } from "@/components/file-sidebar/sidebar";

export default function NotesPage() {
  return (
    <NotesProvider>
      <ResizablePanelGroup direction="horizontal" className="h-auto">
        <ResizablePanel defaultSize={25} minSize={10} maxSize={40}>
          <FileSidebar />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75}>
          <NotesEditor />
        </ResizablePanel>
      </ResizablePanelGroup>
    </NotesProvider>
  );
}
