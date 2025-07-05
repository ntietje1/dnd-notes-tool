"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Page() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Welcome to D&D Notes
          </h1>
          <div className="flex flex-col gap-4">
            <p className="text-xl text-gray-600 dark:text-gray-300">
              You&apos;re signed in! Ready to start your adventure?
            </p>
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                className="text-lg px-8"
                onClick={() => router.push("/example")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
          D&D Notes Tool
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Your ultimate companion for managing D&D campaigns
        </p>
        <Button
          size="lg"
          className="text-lg px-8"
          onClick={() => router.push("/signin")}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
