"use client";

import dynamic from "next/dynamic";
import { CharactersHeaderLoading } from "./characters-header-loading";

const CharactersHeader = dynamic(() => import("./characters-header"), {
  ssr: false,
  loading: () => <CharactersHeaderLoading />,
});

export function CharactersHeaderWrapper() {
  return <CharactersHeader />;
} 