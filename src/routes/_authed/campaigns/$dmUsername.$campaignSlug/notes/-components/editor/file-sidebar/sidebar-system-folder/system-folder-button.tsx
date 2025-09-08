import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";
import { CharacterSystemFolder } from "./character-system-folder/character-system-folder";
import { LocationSystemFolder } from "./location-system-folder/location-system-folder";
import { SessionSystemFolder } from "./session-system-folder/session-system-folder";
import type { Id } from "convex/_generated/dataModel";

interface SystemFolderButtonProps {
  tagCategory: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
}

export const SystemFolderButton = ({
  tagCategory,
  isExpanded,
  onToggleExpanded,
  renamingId,
  setRenamingId,
}: SystemFolderButtonProps) => {
  switch (tagCategory) {
    case SYSTEM_TAG_CATEGORY_NAMES.Character:
      return (
        <CharacterSystemFolder
          isExpanded={isExpanded}
          onToggleExpanded={onToggleExpanded}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
        />
      );
    case SYSTEM_TAG_CATEGORY_NAMES.Location:
      return (
        <LocationSystemFolder
          isExpanded={isExpanded}
          onToggleExpanded={onToggleExpanded}
          renamingId={renamingId}
          setRenamingId={setRenamingId}

        />
      );
    case SYSTEM_TAG_CATEGORY_NAMES.Session:
      return (
        <SessionSystemFolder
          isExpanded={isExpanded}
          onToggleExpanded={onToggleExpanded}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
        />
      );
    default:
      throw new Error(`Unknown tag type attempted to render: ${tagCategory}`);
  }
};
