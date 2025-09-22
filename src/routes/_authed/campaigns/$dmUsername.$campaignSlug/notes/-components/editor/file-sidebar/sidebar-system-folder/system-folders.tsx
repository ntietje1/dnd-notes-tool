import { cn } from "~/lib/utils";
import { SystemFolderButton } from "./system-folder-button";
import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";

const SIDEBAR_FOLDER_TYPES = [
  SYSTEM_TAG_CATEGORY_NAMES.Character,
  SYSTEM_TAG_CATEGORY_NAMES.Location,
  SYSTEM_TAG_CATEGORY_NAMES.Session,
] as const;

interface SystemFoldersProps {
  className?: string;
}

export const SystemFolders = ({
  className,
}: SystemFoldersProps) => {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {SIDEBAR_FOLDER_TYPES.map((tagCategory) => (
        <SystemFolderButton
          key={tagCategory}
          tagCategory={tagCategory}
        />
      ))}
    </div>
  );
};