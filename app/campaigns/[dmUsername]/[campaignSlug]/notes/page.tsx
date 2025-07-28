import { FileTopbarWrapper } from "./editor/file-topbar/topbar-wrapper";
import { NotesEditorWrapper } from "./editor/notes-editor-wrapper";
import { NotesViewerWrapper } from "./viewer/notes-viewer-wrapper";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

export default function NotesIndexPage() {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={50} minSize={25} className="flex flex-col">
        <FileTopbarWrapper />
        <NotesEditorWrapper />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={25} className="flex flex-col">
        <NotesViewerWrapper />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
