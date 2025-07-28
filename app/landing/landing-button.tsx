"use client";

import { useConvexAuth } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LandingPageButton() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <Button size="lg" className="text-lg px-8 min-w-32" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isAuthenticated) {
    return (
      <Button
        size="lg"
        className="text-lg px-8 min-w-32"
        onClick={() => router.push("/campaigns")}
      >
        Continue
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="text-lg px-8 min-w-32"
      onClick={() => router.push("/signin")}
    >
      Get Started
    </Button>
  );
}
