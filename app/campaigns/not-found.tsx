import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CampaignsNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Campaign Not Found</h2>
        <p className="text-gray-600 max-w-md">
          The campaign you're looking for doesn't exist or you don't have access
          to it.
        </p>
        <Button asChild>
          <Link href="/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    </div>
  );
}
