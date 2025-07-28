"use client";

import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

export function HeaderAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  if (isLoading) {
    return (
      <Button className="min-w-24 text-primary" variant="outline" disabled>
        <Loader2Icon className="h-4 w-4 animate-spin" />
        Loading
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button
        className="min-w-24 text-primary"
        variant="outline"
        onClick={async () => {
          router.push("/");
          await signOut();
        }}
      >
        Sign out
      </Button>
    );
  }

  return (
    <Button
      className="min-w-24 text-primary"
      variant="outline"
      onClick={() => router.push("/signin")}
    >
      Sign in
    </Button>
  );
}
