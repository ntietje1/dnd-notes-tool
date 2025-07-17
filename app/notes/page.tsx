import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { NotesEditor } from "./notes-editor";
import { NotesProvider } from "@/contexts/NotesContext";
import { FileSidebar } from "@/app/notes/editor/file-sidebar/sidebar";

export default function NotesPage() {
  return (
    <NotesProvider>
      <div className="h-full flex flex-col">
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 overflow-hidden"
        >
          <ResizablePanel
            defaultSize={25}
            minSize={10}
            className="overflow-y-auto"
          >
            <FileSidebar />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={75}
            minSize={25}
            className="overflow-hidden"
          >
            <NotesEditor />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </NotesProvider>
  );
}
