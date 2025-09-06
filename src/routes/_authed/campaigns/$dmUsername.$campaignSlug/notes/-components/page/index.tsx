import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/components/shadcn/ui/resizable";
import { NotesEditor } from "../editor/notes-editor";
import { NotesViewer } from "../viewer/notes-viewer";
import { FileTopbar } from "../editor/file-topbar/topbar";

export function NotesPage() {
    return (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={50} minSize={25} className="flex flex-col">
            <FileTopbar />
            <NotesEditor />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={25} className="flex flex-col">
            <NotesViewer />
        </ResizablePanel>
        </ResizablePanelGroup>
    )
}