import type { Tag } from "convex/tags/types";
import { filterSuggestionItems } from "@blocknote/core";
import {
  type DefaultReactSuggestionItem,
  SuggestionMenuController,
} from "@blocknote/react";
import { useTags } from "./use-tags";
import type { CustomBlockNoteEditor } from "~/lib/editor-schema";
import { toast } from "sonner";

const getTagMenuItems = (
  onAddTag: (tag: Tag) => void,
  tags?: Tag[],
): DefaultReactSuggestionItem[] => {
  if (!tags) return [];

  return tags.map((tag: Tag) => ({
    title: tag.name,
    onItemClick: () => onAddTag(tag),
  }));
};

export default function TagMenu({
  editor,
}: {
  editor?: CustomBlockNoteEditor;
}) {
  const { tags } = useTags();

  const nonSystemTags = tags || [];

  const onAddTag = (tag: Tag) => {
    if (!editor) return;

    const tagContent = {
      tagId: tag._id as string,
      tagName: tag.name,
      tagColor: tag.color,
    };
    
    try { //TODO: fix this
      (editor as any).insertInlineContent([
        {
          type: "tag",
          props: tagContent,
        },
        " ", // add a space after the mention
      ]);
    } catch (error) {
      console.error("Failed to insert tag:", error);
      toast.error("Failed to insert tag");
    }
  };

  return (
    <SuggestionMenuController
      triggerCharacter={"@"}
      getItems={async (query) =>
        filterSuggestionItems(getTagMenuItems(onAddTag, nonSystemTags), query)
      }
    />
  );
}
