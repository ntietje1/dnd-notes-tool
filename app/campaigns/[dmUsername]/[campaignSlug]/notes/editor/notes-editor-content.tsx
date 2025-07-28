"use client";

import dynamic from "next/dynamic";
import NotesEditorLoading from "./notes-editor-loading";

// Dynamically import the heavy editor component
const NotesEditor = dynamic(() => import("./notes-editor"), {
  ssr: false,
  loading: () => <NotesEditorLoading />,
});

export function NotesEditorContent() {
  return <NotesEditor />;
}
