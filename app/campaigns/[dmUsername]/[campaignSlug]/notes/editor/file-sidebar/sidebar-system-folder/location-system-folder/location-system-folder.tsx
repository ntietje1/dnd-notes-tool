"use client";

import { useState } from "react";
import { TagNote, TagType } from "@/convex/tags/types";
import { LocationSystemFolderContextMenu } from "./location-system-folder-context-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { EditableName } from "../../sidebar-item/editable-name";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NoteButton } from "../../sidebar-note/note-button";
import { Id } from "@/convex/_generated/dataModel";
import { Note } from "@/convex/notes/types";
import { useNotes } from "@/contexts/NotesContext";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { LocationWithTag } from "@/convex/locations/types";
import { toast } from "sonner";
import { LocationNoteContextMenu } from "./location-note-context-menu";

interface LocationSystemFolderProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
}

export const LocationSystemFolder = ({
  isExpanded,
  onToggleExpanded,
  renamingId,
  setRenamingId,
}: LocationSystemFolderProps) => {
  const { updateNoteName, selectNote, currentNote, currentCampaign } = useNotes();
  const [deletingLocation, setDeletingLocation] = useState<LocationWithTag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Mutations
  const updateLocation = useMutation(api.locations.mutations.updateLocation);
  const deleteLocation = useMutation(api.locations.mutations.deleteLocation);
  
  const queryResult = useQuery(api.notes.queries.getTagNotePages, currentCampaign ? {
    tagType: "Location",
    campaignId: currentCampaign._id,
  } : "skip");
  
  const tagNotePages = queryResult ?? [];
  const hasItems = tagNotePages.length > 0;

  // Get all locations for this campaign to map tag IDs to location IDs
  const allLocations = useQuery(api.locations.queries.getLocationsByCampaign, currentCampaign ? {
    campaignId: currentCampaign._id,
  } : "skip");

  // Helper to find location by tag ID
  const findLocationByTagId = (tagId: Id<"tags">) => {
    return allLocations?.find(loc => loc.tagId === tagId);
  };

  // Custom rename handler that syncs location and note names
  const handleLocationNoteRename = async (note: TagNote, newName: string) => {
    if (!currentCampaign) return;
    
    try {
      const location = findLocationByTagId(note.tagId);
      
      if (location) {
        // Update the location name (this will also update the tag and note via the mutation)
        await updateLocation({
          locationId: location._id,
          name: newName,
        });
        
        toast.success("Location renamed successfully");
      } else {
        // Fallback to just updating the note if location not found
        await updateNoteName(note._id, newName);
      }
      
      setRenamingId(null);
    } catch (error) {
      console.error("Failed to rename location:", error);
      toast.error("Failed to rename location");
    }
  };

  // Custom delete handler with confirmation
  const handleLocationNoteDelete = (note: TagNote) => {
    if (!currentCampaign) return;
    
    const location = findLocationByTagId(note.tagId);
    if (location) {
      setDeletingLocation(location);
    } else {
      toast.error("Location not found");
    }
  };

  const confirmDeleteLocation = async () => {
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

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <LocationSystemFolderContextMenu>
        <Button
          variant="ghost"
          className="w-full flex-1 justify-start gap-2 h-8 min-w-0 p-0"
          onClick={onToggleExpanded}
        >
          <div className="flex items-center gap-1 min-w-0 w-full">
            <div className="flex items-center h-4 w-3 shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-2 w-2 pl-1 pr-0.5" />
              ) : (
                <ChevronRight className="h-2 w-2 pl-1 pr-0.5" />
              )}
            </div>
            <MapPin className="h-4 w-4 shrink-0" />
            <EditableName
              initialName="Locations"
              defaultName="Locations"
              isRenaming={false}
              onFinishRename={() => {}}
            />
          </div>
        </Button>
      </LocationSystemFolderContextMenu>
      <CollapsibleContent>
        <div className="relative pl-4">
          {hasItems && (
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-muted-foreground/10" />
          )}
          {tagNotePages.map((note) => (
            <div key={note._id} className="flex w-full min-w-0">
                <LocationNoteContextMenu onEdit={() => setRenamingId(note._id)} onDelete={() => handleLocationNoteDelete(note as TagNote)}>
                    <NoteButton
                        note={note}
                        isRenaming={renamingId === note._id}
                        onFinishRename={(name) => handleLocationNoteRename(note as TagNote, name)}
                        isSelected={currentNote?._id === note._id}
                        onNoteSelected={() => selectNote(note._id)}
                    />
              </LocationNoteContextMenu>
            </div>
          ))}
        </div>
      </CollapsibleContent>
      
      <ConfirmationDialog
        isOpen={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        onConfirm={confirmDeleteLocation}
        title="Delete Location"
        description={`Are you sure you want to delete "${deletingLocation?.name}"? This will also remove all references to this location in your notes. This action cannot be undone.`}
        confirmLabel="Delete Location"
        isLoading={isDeleting}
        icon={MapPin}
      />
    </Collapsible>
  );
};