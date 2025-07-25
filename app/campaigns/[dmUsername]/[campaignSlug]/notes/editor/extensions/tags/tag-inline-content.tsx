import { createReactInlineContentSpec } from "@blocknote/react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useNotes } from "@/contexts/NotesContext";
import React from "react";

// this file is cursed and typescript shows errors for the imports despite the fact that it works, so using jsx instead

function TagRenderer(props: { tagId: string }) {
  const { currentCampaign } = useNotes();
  const tag = useQuery(api.tags.queries.getTag, {
    campaignId: currentCampaign?._id,
    tagId: props.tagId,
  });

  if (!tag) {
    return null;
  }

  return (
    <div
      className="relative inline-flex items-center rounded-full px-1.5 text-sm font-medium pb-0.5"
      style={{
        backgroundColor: `${tag.color}15`,
      }}
    >
      <div
        className="absolute inset-0 rounded-full mix-blend-multiply"
        style={{
          backgroundColor: `${tag.color}20`,
        }}
      />
      <span className="opacity-85">@{tag.name}</span>
    </div>
  );
}

// The Tag inline content specification
export const TagInlineContent = createReactInlineContentSpec(
  {
    type: "tag",
    propSchema: {
      tagId: {
        default: "",
      },
    },
    content: "none",
  },
  {
    render: (props) => <TagRenderer tagId={props.inlineContent.props.tagId} />,
  },
);
