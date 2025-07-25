"use client";

import dynamic from "next/dynamic";

export const NotesViewer = dynamic(() => import("./notes-viewer"), {
  ssr: false,
});
