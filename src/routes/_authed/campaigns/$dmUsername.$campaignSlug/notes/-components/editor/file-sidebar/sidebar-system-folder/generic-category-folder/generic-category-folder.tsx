import { Button } from "~/components/shadcn/ui/button";
import {
  ChevronDown,
  ChevronRight,
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
        <div className="relative pl-4">
          {/* Vertical line */}
          {hasItems && (
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-muted-foreground/10" />
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
  return (
    <Button
        variant="ghost"
        className="w-full flex-1 justify-start gap-2 h-8 min-w-0 p-0"
        onClick={toggleExpanded}
    >
        <div className="flex items-center gap-1 min-w-0 w-full">
        <div className="flex items-center h-4 w-3 shrink-0">
            {isExpanded ? (
            <ChevronDown className="h-2 w-2 pl-1 pr-0.5" />
            ) : (
            <ChevronRight className="h-2 w-2 pl-1 pr-0.5" />
            )}
        </div>
        {icon}
        <EditableName
            initialName={categoryName}
            defaultName={categoryName}
            isRenaming={false} // not actually editable here
            onFinishRename={() => {}}
        />
        </div>
    </Button>
  );
};