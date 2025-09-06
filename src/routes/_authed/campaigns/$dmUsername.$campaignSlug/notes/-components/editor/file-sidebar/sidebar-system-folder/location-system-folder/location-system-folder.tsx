import { useState } from "react";
import { SYSTEM_TAG_CATEGORY_NAMES, type TagNote } from "convex/tags/types";
import { LocationSystemFolderContextMenu } from "./location-system-folder-context-menu";
import { Button } from "~/components/shadcn/ui/button";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
} from "~/lib/icons";
import { EditableName } from "../../sidebar-item/editable-name";
import { Collapsible, CollapsibleContent } from "~/components/shadcn/ui/collapsible";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { NoteButton } from "../../sidebar-note/note-button";
import type { Id } from "convex/_generated/dataModel";
import { useNotes } from "~/contexts/NotesContext";
import { ConfirmationDialog } from "~/components/dialogs/confirmation-dialog";
import type { LocationWithTag } from "convex/locations/types";
import { toast } from "sonner";
import { LocationNoteContextMenu } from "./location-note-context-menu";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import type { Note } from "convex/notes/types";
import { useCampaign } from "~/contexts/CampaignContext";

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
  const { updateNoteName, selectNote, note } = useNotes();
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;
  const [deletingLocation, setDeletingLocation] = useState<LocationWithTag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const updateLocation = useMutation({mutationFn: useConvexMutation(api.locations.mutations.updateLocation)});
  const deleteLocation = useMutation({mutationFn: useConvexMutation(api.locations.mutations.deleteLocation)});
  
  const queryResult = useQuery(convexQuery(api.notes.queries.getTagNotePages, campaign ? {
    tagCategory: SYSTEM_TAG_CATEGORY_NAMES.Location,
    campaignId: campaign._id,
  } : "skip"));
  
  const tagNotePages = queryResult.data ?? [];
  const hasItems = tagNotePages.length > 0;

  const allLocations = useQuery(convexQuery(api.locations.queries.getLocationsByCampaign, campaign ? {
    campaignId: campaign._id,
  } : "skip"));

  const findLocationByTagId = (tagId: Id<"tags">) => {
    return allLocations.data?.find(loc => loc.tagId === tagId);
  };

  const handleLocationNoteRename = async (note: TagNote, newName: string) => {
    if (!campaign) return;
    
    try {
      const location = findLocationByTagId(note.tagId);
      if (!location) {
        toast.error("Location not found");
        return;
      }
      
      await updateLocation.mutateAsync({
        locationId: location._id,
        name: newName,
      });

      updateNoteName(note._id, newName);
      
      toast.success("Location renamed successfully");
    } catch (_) {
      toast.error("Failed to rename location");
    } finally {
      setRenamingId(null);
    }
  };

  const handleLocationNoteDelete = (note: TagNote) => {
    if (!campaign) return;
    
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
      await deleteLocation.mutateAsync({
        locationId: deletingLocation._id,
      });

      toast.success("Location deleted successfully");
      setDeletingLocation(null);
    } catch (_) {
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
          {tagNotePages.map((tagNote) => (
            <div key={tagNote._id} className="flex w-full min-w-0">
                <LocationNoteContextMenu onEdit={() => setRenamingId(tagNote._id)} onDelete={() => handleLocationNoteDelete(tagNote as TagNote)}>
                    <NoteButton
                        note={tagNote as Note}
                        isRenaming={renamingId === tagNote._id}
                        onFinishRename={(name) => handleLocationNoteRename(tagNote as TagNote, name)}
                        isSelected={note?._id === tagNote._id}
                        onNoteSelected={() => selectNote(tagNote._id)}
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