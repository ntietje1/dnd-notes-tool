// @ts-nocheck

import { createReactInlineContentSpec } from "@blocknote/react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useNotes } from "@/contexts/NotesContext";
import React from "react";

// this file is cursed and typescript shows errors for the imports despite the fact that it works

export const TagInlineContent = createReactInlineContentSpec(
  {
    type: "tag",
    propSchema: {
      tagId: { default: "" },
      tagName: { default: "" },
      tagColor: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { currentCampaign } = useNotes();
      const tag = useQuery(api.tags.queries.getTag, {
        campaignId: currentCampaign?._id,
        tagId: props.inlineContent.props.tagId,
      });

      const name = tag?.name ?? props.inlineContent.props.tagName;
      const color = tag?.color ?? props.inlineContent.props.tagColor;
      return (
        <span className="opacity-65" style={{ backgroundColor: `${color}35` }}>
          @{name}
        </span>
      );
    },
  },
);
