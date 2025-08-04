"use client";

import dynamic from "next/dynamic";
import { LocationsContentLoading } from "./locations-content-loading";

const LocationsContent = dynamic(() => import("./locations-content"), {
  ssr: false,
  loading: () => <LocationsContentLoading />,
});

export function LocationsContentWrapper() {
  return <LocationsContent />;
} 