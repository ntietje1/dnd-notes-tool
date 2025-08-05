"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLocations } from "../layout";
import { ContentGrid } from "@/components/ui/content-grid-page/content-grid";
import { ContentCard } from "@/components/ui/content-grid-page/content-card";
import { CreateActionCard } from "@/components/ui/content-grid-page/create-action-card";
import { EmptyState } from "@/components/ui/content-grid-page/empty-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { LocationDialog } from "./location-dialog";
import { LocationWithTag } from "@/convex/locations/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LocationsContent() {
  const { currentCampaign, dmUsername, campaignSlug } = useLocations();
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationWithTag | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<LocationWithTag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const locations = useQuery(
    api.locations.queries.getLocationsByCampaign,
    currentCampaign?._id ? { campaignId: currentCampaign._id } : "skip"
  );

  const deleteLocation = useMutation(api.locations.mutations.deleteLocation);

  const handleViewLocationNotes = (location: LocationWithTag) => {
    router.push(`/campaigns/${dmUsername}/${campaignSlug}/notes?locationId=${location._id}`);
  };

  const handleDeleteLocation = async () => {
    if (!deletingLocation) return;

    setIsDeleting(true);

    try {
      await deleteLocation({
        locationId: deletingLocation._id,
      });

      toast.success("Location deleted successfully");
      setDeletingLocation(null);
    } catch (error) {
      console.error("Failed to delete location:", error);
      toast.error("Failed to delete location");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentCampaign) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">No campaign selected</h3>
        </div>
      </div>
    );
  }

  if (!locations) {
    // This will be handled by the wrapper's loading component
    return null;
  }

  return (
    <>
      <ContentGrid>
        {(locations.length > 0) && (
          <CreateActionCard
            onClick={() => setIsCreateDialogOpen(true)}
            title="Create New Location"
            description="Add a new location to your campaign"
            icon={MapPin}
          />
        )}
        
        {locations.map((location) => (
          <ContentCard
            key={location._id}
            title={location.name}
            description={location.description}
            color={location.color}
            badge={{
              text: "Location",
              icon: <MapPin className="w-3 h-3" />,
              variant: "secondary"
            }}
            onClick={() => handleViewLocationNotes(location)}
            actionButtons={[
              {
                icon: <Edit className="w-4 h-4" />,
                onClick: (e) => {
                  e.stopPropagation();
                  setEditingLocation(location);
                },
                "aria-label": "Edit location"
              },
              {
                icon: <Trash2 className="w-4 h-4" />,
                onClick: (e) => {
                  e.stopPropagation();
                  setDeletingLocation(location);
                },
                "aria-label": "Delete location",
                variant: "destructive-subtle"
              }
            ]}
          />
        ))}
        
        {locations.length === 0 && (
          <EmptyState
            icon={MapPin}
            title="No locations yet"
            description="Create your first location to start organizing places in your campaign. Each location will automatically create a tag you can use in your notes."
            action={{
              label: "Create First Location",
              onClick: () => setIsCreateDialogOpen(true),
              icon: Plus
            }}
          />
        )}
      </ContentGrid>

      <LocationDialog
        mode="create"
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        campaignId={currentCampaign._id}
      />

      {editingLocation && (
        <LocationDialog
          mode="edit"
          isOpen={true}
          onClose={() => setEditingLocation(null)}
          location={editingLocation}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        onConfirm={handleDeleteLocation}
        title="Delete Location"
        description={`Are you sure you want to delete "${deletingLocation?.name}"? This will also remove all references to this location in your notes. This action cannot be undone.`}
        confirmLabel="Delete Location"
        isLoading={isDeleting}
        icon={MapPin}
      />
    </>
  );
} 