"use client";

import { ReactNode } from "react";
import { NotesProvider, useNotes } from "@/contexts/NotesContext";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileSidebar } from "./editor/file-sidebar/sidebar";
import { FileTopbar } from "./editor/file-topbar/topbar";
import { SidebarHeader } from "./editor/file-sidebar/sidebar-header";

interface NotesSectionLayoutProps {
  children: ReactNode;
  params: Promise<{
    dmUsername: string;
    campaignSlug: string;
  }>;
}

function NotesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={10} className="flex flex-col">
          <SidebarHeader />
          <div className="flex-1 overflow-y-auto">
            <FileSidebar />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={80} minSize={25} className="flex flex-col">
          <FileTopbar />
          <div className="flex-1 overflow-hidden">{children}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default function NotesSectionLayout({
  children,
  params,
}: NotesSectionLayoutProps) {
  const searchParams = useSearchParams();
  const noteId = searchParams.get("noteId");
  const { dmUsername, campaignSlug } = React.use(params);

  return (
    <NotesProvider
      dmUsername={dmUsername}
      campaignSlug={campaignSlug}
      noteId={noteId || undefined}
    >
      <NotesLayout>{children}</NotesLayout>
    </NotesProvider>
  );
}
