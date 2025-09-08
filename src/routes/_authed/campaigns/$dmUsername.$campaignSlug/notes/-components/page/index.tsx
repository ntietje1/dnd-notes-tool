import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/components/shadcn/ui/resizable";
import { NotesViewer } from "../viewer/notes-viewer";
import { FileTopbar } from "../editor/file-topbar/topbar";

export function NotesPageLayout({ children }: { children: React.ReactNode }) {
    return (
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={50} minSize={25} className="flex min-h-0 flex-col">
            <FileTopbar />
            {children}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} minSize={25} className="flex min-h-0 flex-col">
            <NotesViewer />
        </ResizablePanel>
        </ResizablePanelGroup>
    )
}