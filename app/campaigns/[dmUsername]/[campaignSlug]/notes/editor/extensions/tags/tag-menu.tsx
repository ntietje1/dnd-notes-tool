import { Tag } from "@/convex/tags/types";
import { filterSuggestionItems } from "@blocknote/core";
import {
  DefaultReactSuggestionItem,
  SuggestionMenuController,
} from "@blocknote/react";
import { useTags } from "./use-tags";
import { CustomBlockNoteEditor } from "@/app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";

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

  const onAddTag = (tag: Tag) => {
    if (!editor) return;

    editor.insertInlineContent([
      {
        type: "tag",
        props: { tagId: tag._id, tagName: tag.name, tagColor: tag.color },
      },
      " ", // add a space after the mention
    ]);
  };

  return (
    <SuggestionMenuController
      triggerCharacter={"@"}
      getItems={async (query) =>
        filterSuggestionItems(getTagMenuItems(onAddTag, tags), query)
      }
    />
  );
}
