import {
  ChevronDown,
  ChevronRight,
  Folder as FolderIcon,
  FolderEdit as FolderEditIcon,
  MoreHorizontal,
} from "~/lib/icons";
import { Button } from "~/components/shadcn/ui/button";
import { FolderName } from "./folder-name";
import type { Folder } from "convex/notes/types";
import { HoverToggleButton } from "~/components/hover-toggle-button";
import { cn } from "~/lib/utils";

interface FolderButtonBaseProps {
  folder: Folder;
  handleToggleExpanded?: (e: React.MouseEvent) => void;
  handleSelect?: (e: React.MouseEvent) => void;
  handleMoreOptions?: (e: React.MouseEvent) => void;
  isExpanded?: boolean;
  isSelected?: boolean;
  isRenaming?: boolean;
}

export function FolderButtonBase({
  folder,
  handleToggleExpanded = () => {},
  handleSelect = () => {},
  handleMoreOptions = () => {},
  isExpanded = false,
  isSelected = false,
  isRenaming = false,
}: FolderButtonBaseProps) {
  return (
    <div
      className={cn(
        "group relative flex items-center w-full h-8 px-1 rounded-sm hover:bg-muted/50 transition-colors",
        isSelected && "bg-muted"
      )}
    >
      {/* Folder Icon / Chevron Toggle */}
      <HoverToggleButton
        className="relative h-6 w-6 shrink-0 flex items-center justify-center text-muted-foreground"
        nonHoverComponent={
          isRenaming ? (
            <FolderEditIcon className="h-4 w-4" />
          ) : (
            <FolderIcon className="h-4 w-4" />
          )
        }
        hoverComponent={
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 hover:text-foreground hover:bg-muted-foreground/10 rounded-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpanded(e);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        }
      />

      {/* Folder Name */}
      <div
        className="flex items-center min-w-0 flex-1 px-1 py-1 rounded-sm"
        onClick={handleSelect}
      >
        <FolderName folder={folder} />
      </div>

      {/* More Options Button */}
      <HoverToggleButton
        className="relative h-6 w-6 shrink-0 flex items-center justify-center"
        nonHoverComponent={null}
        hoverComponent={
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-sm"
            onClick={handleMoreOptions}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        }
      />
    </div>
  );
}
