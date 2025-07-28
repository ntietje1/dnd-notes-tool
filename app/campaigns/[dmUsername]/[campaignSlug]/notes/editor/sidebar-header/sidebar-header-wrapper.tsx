"use client";

import { Suspense } from "react";
import { SidebarHeader } from "./sidebar-header";
import HeaderLoading from "./header-loading";

export function SidebarHeaderWrapper() {
  return (
    <Suspense fallback={<HeaderLoading />}>
      <SidebarHeader />
    </Suspense>
  );
}
