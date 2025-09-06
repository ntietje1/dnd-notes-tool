import { SystemFolderButton } from "./system-folder-button";
import { useCallback, useState } from "react";
import type { Id } from "convex/_generated/dataModel";
import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";

const SIDEBAR_FOLDER_TYPES = [
  SYSTEM_TAG_CATEGORY_NAMES.Character,
  SYSTEM_TAG_CATEGORY_NAMES.Location,
  SYSTEM_TAG_CATEGORY_NAMES.Session,
] as const;

interface SystemFoldersProps {
  renamingId: Id<"folders"> | Id<"notes"> | null;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
}

export const SystemFolders = ({
  renamingId,
  setRenamingId,
}: SystemFoldersProps) => {
    const [expandedSystemFolders, setExpandedSystemFolders] = useState<Set<string>>(new Set());

  const toggleSystemFolder = useCallback((tagType: string) => {
    setExpandedSystemFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tagType)) {
        newSet.delete(tagType);
      } else {
        newSet.add(tagType);
      }
      return newSet;
    });
  }, []);
  
  return (
    <>
    {SIDEBAR_FOLDER_TYPES.map((tagType) => (
        <SystemFolderButton
          key={tagType}
          tagType={tagType}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
          isExpanded={expandedSystemFolders.has(tagType)}
          onToggleExpanded={() => toggleSystemFolder(tagType)}
        />
      ))}
    </>
  );
};