"use client";

import dynamic from "next/dynamic";
import NotesEditorLoading from "./notes-editor-loading";

const NotesEditor = dynamic(() => import("./notes-editor"), {
  ssr: false,
  loading: () => <NotesEditorLoading />,
});

export function NotesEditorWrapper() {
  return <NotesEditor />;
}
