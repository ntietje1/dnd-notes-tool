"use client";

import dynamic from "next/dynamic";
import { CharactersContentLoading } from "./characters-content-loading";

const CharactersContent = dynamic(() => import("./characters-content"), {
  ssr: false,
  loading: () => <CharactersContentLoading />,
});

export function CharactersContentWrapper() {
  return <CharactersContent />;
} 