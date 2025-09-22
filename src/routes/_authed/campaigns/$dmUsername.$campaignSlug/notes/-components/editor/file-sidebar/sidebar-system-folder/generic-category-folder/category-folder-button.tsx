import { Button } from "~/components/shadcn/ui/button";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  type LucideIcon,
} from "~/lib/icons";
import { EditableName } from "../../sidebar-item/editable-name";
import { Collapsible, CollapsibleContent } from "~/components/shadcn/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { convexQuery } from "@convex-dev/react-query";
import { useCampaign } from "~/contexts/CampaignContext";
import { useFolderState } from "~/hooks/useFolderState";
import { CategoryContextMenu, type CategoryContextMenuProps } from "./category-context-menu";
import { TagNoteContextMenu, type TagNoteContextMenuProps } from "./tag-note-context.menu";
import type { TagWithNote } from "convex/tags/types";
import { toast } from "sonner";
import { HoverToggleButton } from "~/components/hover-toggle-button";
import { useRef } from "react";
import type { ContextMenuRef } from "~/components/context-menu/context-menu";
import { TagNoteButton } from "./tag-note-button";
import type { TagCategoryConfig } from "~/components/forms/category-tag-dialogs/base-tag-dialog/types";

type CategoryContextMenuComponent = React.ComponentType<CategoryContextMenuProps>;
type NoteContextMenuComponent = React.ComponentType<TagNoteContextMenuProps>;

interface CategoryFolderButtonProps {
  categoryConfig: TagCategoryConfig;
  categoryContextMenu?: CategoryContextMenuComponent;
  tagNoteContextMenu?: NoteContextMenuComponent;
}

export const CategoryFolderButton = ({ 
  categoryConfig,
  categoryContextMenu,
  tagNoteContextMenu,
}: CategoryFolderButtonProps) => {
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;
  const { isExpanded, toggleExpanded } = useFolderState(categoryConfig.categoryName);
  const categoryContextMenuRef = useRef<ContextMenuRef>(null);
  
  const tagNotePagesQuery = useQuery(convexQuery(api.notes.queries.getTagNotePages, campaign ? {
    tagCategory: categoryConfig.categoryName,
    campaignId: campaign._id,
  } : "skip"));
  
  const tagNotePages = tagNotePagesQuery.data ?? [];
  const hasItems = tagNotePages.length > 0;

  const CategoryContextMenuComponent = categoryContextMenu || CategoryContextMenu;
  const TagNoteContextMenuComponent = tagNoteContextMenu || TagNoteContextMenu;

  return (
    <Collapsible open={isExpanded} onOpenChange={toggleExpanded}>
      <CategoryContextMenuComponent ref={categoryContextMenuRef} categoryConfig={categoryConfig}>
        <CategoryFolderBase
          icon={categoryConfig.icon}
          categoryName={categoryConfig.plural}
          isExpanded={isExpanded}
          toggleExpanded={toggleExpanded}
          contextMenuRef={categoryContextMenuRef}
        />
      </CategoryContextMenuComponent>
      <CollapsibleContent>
        <div className="relative pl-2">
          {/* Vertical line */}
          {hasItems && (
            <div className="absolute left-1 top-0 bottom-0 w-px bg-muted-foreground/5" />
          )}
          {(tagNotePages.map((tagWithNote: TagWithNote) => (
              <TagNoteButton
                key={tagWithNote.note._id}
                tagWithNote={tagWithNote}
                contextMenuComponent={TagNoteContextMenuComponent}
                categoryConfig={categoryConfig}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface CategoryFolderBaseProps {
    icon: LucideIcon;
    categoryName: string;
    isExpanded: boolean;
    toggleExpanded: () => void;
    contextMenuRef: React.RefObject<ContextMenuRef | null>;
}

const CategoryFolderBase = ({
    icon,
    categoryName,
    isExpanded,
    toggleExpanded,
    contextMenuRef,
}: CategoryFolderBaseProps) => {
  const handleFolderClick = () => {
    toast.info("Category folder clicked - functionality coming soon!");
  };

  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    contextMenuRef.current?.open({ x: e.clientX + 4, y: e.clientY + 4 });
  };

  const Icon = icon;

  return (
    <div className="group relative flex items-center w-full h-8 px-1 rounded-sm hover:bg-muted/50 transition-colors">
      {/* Category Icon / Chevron Toggle */}
      <HoverToggleButton
        className="relative h-6 w-6 shrink-0 flex items-center justify-center text-muted-foreground"
        nonHoverComponent={<Icon className="h-4 w-4 shrink-0" />}
        hoverComponent={
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 hover:text-foreground hover:bg-muted-foreground/10 rounded-sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
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

      {/* Category Name */}
      <div 
        className="flex items-center min-w-0 flex-1 px-1 py-1 rounded-sm"
        onClick={handleFolderClick}
      >
        <EditableName
          initialName={categoryName}
          defaultName={categoryName}
          isRenaming={false} // not actually editable here
          onFinishRename={() => {}}
        />
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
};