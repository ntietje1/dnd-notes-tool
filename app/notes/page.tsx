import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { NotesEditor, NotesSidebar } from "./notes-content";
import { NotesProvider } from "@/contexts/NotesContext";

export default function NotesPage() {
  return (
    <NotesProvider>
      <ResizablePanelGroup direction="horizontal" className="h-auto">
        <ResizablePanel defaultSize={25} minSize={10} maxSize={40}>
          <NotesSidebar />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75}>
          <NotesEditor />
        </ResizablePanel>
      </ResizablePanelGroup>
    </NotesProvider>
  );
}
