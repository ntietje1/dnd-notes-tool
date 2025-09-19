import { Button } from "~/components/shadcn/ui/button";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
} from "~/lib/icons";
import { EditableName } from "../../sidebar-item/editable-name";
import { Collapsible, CollapsibleContent } from "~/components/shadcn/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { NoteButton } from "../../sidebar-note/note-button";
import { convexQuery } from "@convex-dev/react-query";
import { useCampaign } from "~/contexts/CampaignContext";
import { useFolderState } from "~/hooks/useFolderState";
import { GenericCategoryContextMenu, type GenericCategoryContextMenuProps } from "./generic-category-context-menu";
import { GenericTagNoteContextMenu, type GenericTagNoteContextMenuProps } from "./generic-note-context.menu";
import type { TagWithNote } from "convex/tags/types";
import { toast } from "sonner";
import { HoverToggleButton } from "~/components/hover-toggle-button";

type CategoryContextMenuComponent = React.ComponentType<GenericCategoryContextMenuProps>;
type NoteContextMenuComponent = React.ComponentType<GenericTagNoteContextMenuProps>;

interface CategoryFolderProps {
  categoryName: string;
  icon: React.ReactNode;
  categoryContextMenu?: CategoryContextMenuComponent;
  noteContextMenu?: NoteContextMenuComponent;
}

export const GenericCategoryFolder = ({ 
  categoryName,
  icon, 
  categoryContextMenu,
  noteContextMenu,
}: CategoryFolderProps) => {
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;
  const { isExpanded, toggleExpanded } = useFolderState(categoryName);
  
  const tagNotePagesQuery = useQuery(convexQuery(api.notes.queries.getTagNotePages, campaign ? {
    tagCategory: categoryName,
    campaignId: campaign._id,
  } : "skip"));
  
  const tagNotePages = tagNotePagesQuery.data ?? [];
  const hasItems = tagNotePages.length > 0;

  const CategoryContextMenuComponent = categoryContextMenu || GenericCategoryContextMenu;
  const NoteContextMenuComponent = noteContextMenu || GenericTagNoteContextMenu;

  return (
    <Collapsible open={isExpanded} onOpenChange={toggleExpanded}>
      <CategoryContextMenuComponent categoryName={categoryName}>
        <GenericCategoryFolderButton
          icon={icon}
          categoryName={categoryName + "s"}
          isExpanded={isExpanded}
          toggleExpanded={toggleExpanded}
        />
      </CategoryContextMenuComponent>
      <CollapsibleContent>
        <div className="relative pl-2">
          {/* Vertical line */}
          {hasItems && (
            <div className="absolute left-1 top-0 bottom-0 w-px bg-muted-foreground/5" />
          )}
          {(tagNotePages.map((tagWithNote: TagWithNote) => (
            <NoteContextMenuComponent
              key={tagWithNote.note._id}
              categoryName={categoryName}
              tag={tagWithNote}
            >
              <NoteButton note={tagWithNote.note} />
            </NoteContextMenuComponent>
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface GenericCategoryFolderButtonProps {
    icon?: React.ReactNode;
    categoryName: string;
    isExpanded: boolean;
    toggleExpanded: () => void;
}

const GenericCategoryFolderButton = ({
    icon,
    categoryName,
    isExpanded,
    toggleExpanded,
}: GenericCategoryFolderButtonProps) => {
  const handleFolderClick = () => {
    toast.info("Category folder clicked - functionality coming soon!");
  };

  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("More options - functionality coming soon!");
  };

  return (
    <div className="group relative flex items-center w-full h-8 px-1 rounded-sm hover:bg-muted/50 transition-colors">
      {/* Category Icon / Chevron Toggle */}
      <HoverToggleButton
        className="relative h-6 w-6 shrink-0 flex items-center justify-center text-muted-foreground"
        nonHoverComponent={icon}
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