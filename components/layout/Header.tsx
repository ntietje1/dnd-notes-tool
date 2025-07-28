"use client";

import { usePathname } from "next/navigation";
import { HeaderServer } from "./header-server";
import { HeaderAuth } from "./header-auth";

export function Header() {
  const pathname = usePathname();

  const nonHeaderPages = ["/", "/signin", "/onboarding"];

  // Always render the header when the user is authenticated already.
  // Don't render the header on landing page or signin/signup flows.
  if (nonHeaderPages.includes(pathname)) {
    return null;
  }

  return (
    <div className="bg-background h-10 border-b border-border">
      <div className="mx-auto flex justify-between items-center h-full px-4">
        <HeaderServer />
        <HeaderAuth />
      </div>
    </div>
  );
}
