"use client";

import { ReactNode } from "react";
import { NotesProvider } from "@/contexts/NotesContext";
import { useSearchParams } from "next/navigation";
import * as React from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileSidebar } from "./editor/file-sidebar/sidebar";

interface NotesSectionLayoutProps {
  children: ReactNode;
  params: Promise<{
    dmUsername: string;
    campaignSlug: string;
  }>;
}

export default function NotesSectionLayout({ children, params }: NotesSectionLayoutProps) {
  const searchParams = useSearchParams();
  const noteId = searchParams.get("noteId");
  const { dmUsername, campaignSlug } = React.use(params);
  return (
    <NotesProvider dmUsername={dmUsername} campaignSlug={campaignSlug} noteId={noteId || undefined}>
      <div className="h-full flex flex-col">
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 overflow-hidden"
        >
          <ResizablePanel
            defaultSize={20}
            minSize={10}
            className="overflow-y-auto"
          >
            <FileSidebar />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={80}
            minSize={25}
            className="overflow-hidden"
          >
          {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </NotesProvider>
  );
}