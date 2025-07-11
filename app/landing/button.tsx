"use client";

import { Button } from "@/components/ui/button";
import { useConvexAuth } from "convex/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function LandingPageButton() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <LoadingButton />;
  }

  if (isAuthenticated) {
    return <ContinueButton />;
  }

  return <SignInButton />;
}

function LoadingButton() {
  return (
    <Button size="lg" className="text-lg px-8" disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </Button>
  );
}

function SignInButton() {
  const router = useRouter();
  return (
    <Button
      size="lg"
      className="text-lg px-8"
      onClick={() => router.push("/notes")}
    >
      Get Started
    </Button>
  );
}

function ContinueButton() {
  const router = useRouter();
  return (
    <Button
      size="lg"
      className="text-lg px-8"
      onClick={() => router.push("/notes")}
    >
      Continue
    </Button>
  );
}
