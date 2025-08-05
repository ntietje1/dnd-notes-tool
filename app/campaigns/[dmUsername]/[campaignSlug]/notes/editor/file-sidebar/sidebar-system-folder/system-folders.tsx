import { TagType } from "@/convex/tags/types";
import { SystemFolderButton } from "./system-folder-button";
import { useCallback, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

const SIDEBAR_FOLDER_TYPES = ["Character", "Location", "Session"] as const;

interface SystemFoldersProps {
  renamingId: Id<"folders"> | Id<"notes"> | null;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
}

export const SystemFolders = ({
  renamingId,
  setRenamingId,
}: SystemFoldersProps) => {
    const [expandedSystemFolders, setExpandedSystemFolders] = useState<Set<TagType>>(new Set());

  const toggleSystemFolder = useCallback((tagType: TagType) => {
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