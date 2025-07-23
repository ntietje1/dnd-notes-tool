"use client";

import dynamic from "next/dynamic";

export const Editor = dynamic(
  () => import("./notes-editor").then((mod) => mod.NotesEditor),
  { ssr: false },
);
