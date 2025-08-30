import { createFileRoute } from '@tanstack/react-router'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "~/components/shadcn/ui/resizable";
import { NotesEditor } from "./-components/editor/notes-editor";
import { NotesViewer } from "./-components/viewer/notes-viewer";
import { FileTopbar } from "./-components/editor/file-topbar/topbar";

export const Route = createFileRoute('/_authed/campaigns/$dmUsername/$campaignSlug/notes/')({
  component: NotesIndexPage,
})

function NotesIndexPage() {
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
