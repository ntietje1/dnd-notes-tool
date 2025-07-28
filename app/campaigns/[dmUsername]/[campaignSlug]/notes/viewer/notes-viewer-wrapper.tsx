"use client";

import dynamic from "next/dynamic";
import NotesViewerLoading from "./notes-viewer-loading";

const NotesViewer = dynamic(() => import("./notes-viewer"), {
  ssr: false,
  loading: () => <NotesViewerLoading />,
});

export function NotesViewerWrapper() {
  return <NotesViewer />;
}
