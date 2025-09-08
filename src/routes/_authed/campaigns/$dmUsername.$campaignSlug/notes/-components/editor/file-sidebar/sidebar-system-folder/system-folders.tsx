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

  const toggleSystemFolder = useCallback((tagCategory: string) => {
    setExpandedSystemFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tagCategory)) {
        newSet.delete(tagCategory);
      } else {
        newSet.add(tagCategory);
      }
      return newSet;
    });
  }, []);
  
  return (
    <>
    {SIDEBAR_FOLDER_TYPES.map((tagCategory) => (
        <SystemFolderButton
          key={tagCategory}
          tagCategory={tagCategory}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
          isExpanded={expandedSystemFolders.has(tagCategory)}
          onToggleExpanded={() => toggleSystemFolder(tagCategory)}
        />
      ))}
    </>
  );
};