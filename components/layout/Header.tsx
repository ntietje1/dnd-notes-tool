"use client";

import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, usePathname, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

export function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();

  const nonHeaderPages = ["/", "/signin", "/onboarding"];

  // Always render the header when the user is authenticated already.
  // Don't render the header on landing page or signin/signup flows.
  if (!isAuthenticated && nonHeaderPages.includes(pathname)) {
    return null;
  }

  return (
    <header className="bg-background h-10 border-b border-border">
      <div className="mx-auto flex justify-between items-center h-full px-4">
        <Link href="/" className="font-bold text-xl text-primary">
          D&D Connect
        </Link>
        {isLoading ? (
          <Button className="min-w-24 text-primary" variant="outline" disabled>
            <Loader2Icon className="animate-spin" />
            Loading
          </Button>
        ) : isAuthenticated ? (
          <div className="flex items-center gap-4">
            <Button
              className="min-w-24 text-primary"
              variant="outline"
              onClick={async () => {
                await signOut();
                redirect("/signin");
              }}
            >
              Sign out
            </Button>
          </div>
        ) : (
          <Button
            className="min-w-24 text-primary"
            variant="outline"
            onClick={() => redirect("/signin")}
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
