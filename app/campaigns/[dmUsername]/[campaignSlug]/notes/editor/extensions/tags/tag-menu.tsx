import { Tag } from "@/convex/tags/types";
import { filterSuggestionItems } from "@blocknote/core";
import {
  DefaultReactSuggestionItem,
  SuggestionMenuController,
} from "@blocknote/react";
import { useTags } from "./use-tags";
import { CustomBlockNoteEditor } from "@/app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";

const getTagMenuItems = (
  editor?: CustomBlockNoteEditor,
  tags?: Tag[],
): DefaultReactSuggestionItem[] => {
  if (!tags) return [];

  return tags.map((tag: Tag) => ({
    title: tag.name,
    onItemClick: () => {
      editor?.insertInlineContent([
        {
          type: "tag",
          props: {
            tagId: tag._id,
          },
        },
        " ", // add a space after the mention
      ]);
    },
  }));
};

export default function TagMenu({
  editor,
}: {
  editor?: CustomBlockNoteEditor;
}) {
  const { tags } = useTags();

  return (
    <SuggestionMenuController
      triggerCharacter={"@"}
      getItems={async (query) =>
        filterSuggestionItems(getTagMenuItems(editor, tags), query)
      }
    />
  );
}
