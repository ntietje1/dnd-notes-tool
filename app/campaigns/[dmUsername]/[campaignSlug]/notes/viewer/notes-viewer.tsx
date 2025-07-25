"use client";

import React from "react";
import { useTags } from "../editor/extensions/tags/use-tags";
import { useNotes } from "@/contexts/NotesContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BlockNoteView } from "@blocknote/shadcn";
import { BlockNoteSchema, BlockNoteEditor } from "@blocknote/core";
import { customInlineContentSpecs } from "../editor/extensions/tags/tags";
import { Id } from "@/convex/_generated/dataModel";

export default function NotesViewer() {
  const { tags } = useTags();
  const { currentCampaign } = useNotes();
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);

  // Fetch blocks that have all selected tags
  const blocks = useQuery(
    api.notes.queries.getBlocksByTags,
    selectedTagIds.length > 0 && currentCampaign?._id
      ? {
          campaignId: currentCampaign._id,
          tagIds: selectedTagIds as Id<"tags">[],
        }
      : "skip",
  );

  // Create a read-only BlockNoteEditor instance with the fetched blocks
  const schema = React.useMemo(
    () =>
      BlockNoteSchema.create({ inlineContentSpecs: customInlineContentSpecs }),
    [],
  );
  const editor = React.useMemo(() => {
    if (!blocks) return null;
    return BlockNoteEditor.create({
      schema,
      initialContent:
        blocks.length > 0
          ? blocks.map((block) => block.blockContent)
          : undefined,
    });
  }, [blocks, schema]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tag selection UI */}
      <div className="mb-4 flex flex-wrap gap-2">
        {tags?.map((tag) => (
          <button
            key={tag._id}
            className={`px-2 py-1 rounded border ${
              selectedTagIds.includes(tag._id)
                ? "bg-blue-200 border-blue-400"
                : "bg-gray-100 border-gray-300"
            }`}
            onClick={() => {
              setSelectedTagIds((ids) =>
                ids.includes(tag._id)
                  ? ids.filter((id) => id !== tag._id)
                  : [...ids, tag._id],
              );
            }}
            type="button"
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/* Read-only BlockNoteView */}
      <div className="flex-1">
        {editor && (
          <BlockNoteView
            className="h-full overflow-y-auto pt-4"
            editor={editor}
            theme="light"
            editable={false}
          />
        )}
        {!editor && (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            {selectedTagIds.length === 0
              ? "Select tags to view blocks."
              : "No blocks found for selected tags."}
          </div>
        )}
      </div>
    </div>
  );
}
