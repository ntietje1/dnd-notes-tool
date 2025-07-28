import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CampaignsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Create Campaign Card Skeleton */}
      <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-slate-50 border border-slate-200">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Skeleton className="h-16 w-16 rounded-full mb-4" />
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>

      {/* Campaign Card Skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card
          key={i}
          className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-slate-50 border border-slate-200"
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>

              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-14" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
