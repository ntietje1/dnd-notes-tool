"use client";

import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

export function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();

  const nonHeaderPages = ["/", "/signin", "/signup"];

  // Always render the header when the user is authenticated already.
  // Don't render the header on landing page or signin/signup flows.
  if (!isAuthenticated && nonHeaderPages.includes(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-10 bg-background p-4 border-b border-border">
      <div className="mx-auto flex justify-between items-center">
        <Link href="/" className="font-bold text-xl text-primary">
          D&D Notes
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
                router.push("/signin");
                await signOut();
              }}
            >
              Sign out
            </Button>
          </div>
        ) : (
          <Button
            className="min-w-24 text-primary"
            variant="outline"
            onClick={() => router.push("/signin")}
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
