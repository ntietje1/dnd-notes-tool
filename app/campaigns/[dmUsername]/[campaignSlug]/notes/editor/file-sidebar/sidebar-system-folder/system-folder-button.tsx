"use client";

import { TagType } from "@/convex/tags/types";
import { CharacterSystemFolder } from "./character-system-folder/character-system-folder";
import { LocationSystemFolder } from "./location-system-folder/location-system-folder";
import { SessionSystemFolder } from "./session-system-folder/session-system-folder";
import { Id } from "@/convex/_generated/dataModel";

interface SystemFolderButtonProps {
  tagType: TagType;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
}

export const SystemFolderButton = ({
  tagType,
  isExpanded,
  onToggleExpanded,
  renamingId,
  setRenamingId,
}: SystemFolderButtonProps) => {
  // Use specific implementations for each tag type
  switch (tagType) {
    case "Character":
      return (
        <CharacterSystemFolder
          isExpanded={isExpanded}
          onToggleExpanded={onToggleExpanded}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
        />
      );
    case "Location":
      return (
        <LocationSystemFolder
          isExpanded={isExpanded}
          onToggleExpanded={onToggleExpanded}
          renamingId={renamingId}
          setRenamingId={setRenamingId}

        />
      );
    case "Session":
      return (
        <SessionSystemFolder
          isExpanded={isExpanded}
          onToggleExpanded={onToggleExpanded}
          renamingId={renamingId}
          setRenamingId={setRenamingId}

        />
      );
    default:
      // Fallback for other types - basic implementation without context menu
      return null;
  }
};
