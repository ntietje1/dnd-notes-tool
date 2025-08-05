"use client";

import { TagType } from "@/convex/tags/types";
import { DraggableSystemFolder } from "./system-draggable-folder";
import { SystemFolderContextMenu } from "./system-folder-context-menu";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  MapPin,
  User,
} from "lucide-react";
import { EditableName } from "../sidebar-item/editable-name";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface SystemFolderButtonProps {
  tagType: TagType;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const getIcon = (tagType: TagType) => {
  switch (tagType) {
    case "Character":
      return <User className="h-4 w-4 shrink-0" />;
    case "Location":
      return <MapPin className="h-4 w-4 shrink-0" />;
    case "Session":
      return <Calendar className="h-4 w-4 shrink-0" />;
    default:
      return <FileText className="h-4 w-4 shrink-0" />;
  }
};

export const SystemFolderButton = ({
  tagType,
  isExpanded,
  onToggleExpanded,
}: SystemFolderButtonProps) => {
  //TODO: also show blocks with this tag
  const { tagNotePages } = useQuery(api.notes.getTagNotePages, {
    tagType: tagType,
  });

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
      <DraggableSystemFolder id={tagType}>
        <SystemFolderContextMenu>
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
              {getIcon(tagType)}
              <EditableName
                initialName={tagType}
                defaultName={tagType}
                isRenaming={false}
                onFinishRename={() => {}}
              />
            </div>
          </Button>
        </SystemFolderContextMenu>
      </DraggableSystemFolder>
      <CollapsibleContent>
        <div className="relative pl-4">
          {/* Vertical line */}
          {hasItems && (
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-muted-foreground/10" />
          )}
          {folder.children.map((item) => (
            <SidebarItem
              key={item._id}
              item={item}
              renamingId={renamingId}
              setRenamingId={setRenamingId}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
