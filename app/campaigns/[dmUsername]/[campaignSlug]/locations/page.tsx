import { Suspense } from "react";
import { LocationsContentWrapper } from "./components/locations-content-wrapper";
import { MapPin } from "lucide-react";
import { LocationsHeaderWrapper } from "./components/locations-header-wrapper";

function LocationsPageLoading() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold text-slate-600">Loading locations...</h3>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  return (
    <div className="h-full p-6">
      <Suspense fallback={<LocationsPageLoading />}>
        <LocationsHeaderWrapper />
        <LocationsContentWrapper />
      </Suspense>
    </div>
  );
}