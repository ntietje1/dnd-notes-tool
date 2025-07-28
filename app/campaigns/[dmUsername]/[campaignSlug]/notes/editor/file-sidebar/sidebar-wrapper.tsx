"use client";

import { Suspense } from "react";
import { FileSidebar } from "./sidebar";
import SidebarLoading from "./sidebar-loading";

export function FileSidebarWrapper() {
  return (
    <Suspense fallback={<SidebarLoading />}>
      <FileSidebar />
    </Suspense>
  );
}
