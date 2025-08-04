"use client";

import dynamic from "next/dynamic";
import { LocationsHeaderLoading } from "./locations-header-loading";

const LocationsHeader = dynamic(() => import("./locations-header"), {
  ssr: false,
  loading: () => <LocationsHeaderLoading />,
});

export function LocationsHeaderWrapper() {
  return <LocationsHeader />;
} 