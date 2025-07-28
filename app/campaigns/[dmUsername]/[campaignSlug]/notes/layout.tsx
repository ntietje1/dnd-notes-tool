"use client";

import { ReactNode } from "react";
import * as React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileSidebarWrapper } from "./editor/file-sidebar/sidebar-wrapper";
import { SidebarHeaderWrapper } from "./editor/sidebar-header/sidebar-header-wrapper";
import { NotesProvider } from "@/contexts/NotesContext";
import { useSearchParams } from "next/navigation";

interface NotesSectionLayoutProps {
  children: ReactNode;
  params: Promise<{
    dmUsername: string;
    campaignSlug: string;
  }>;
}

function NotesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full flex flex-col bg-white">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={10} className="flex flex-col">
          <SidebarHeaderWrapper />
          <FileSidebarWrapper />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={80} minSize={25} className="flex flex-col">
          {children}
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
