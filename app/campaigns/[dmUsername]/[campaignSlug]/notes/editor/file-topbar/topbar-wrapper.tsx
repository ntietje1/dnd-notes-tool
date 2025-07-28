"use client";

import { Suspense } from "react";
import { FileTopbar } from "./topbar";
import TopbarLoading from "./topbar-loading";

export function FileTopbarWrapper() {
  return (
    <Suspense fallback={<TopbarLoading />}>
      <FileTopbar />
    </Suspense>
  );
}
