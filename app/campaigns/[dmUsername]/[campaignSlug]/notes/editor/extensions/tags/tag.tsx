import { createReactInlineContentSpec } from "@blocknote/react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useNotes } from "@/contexts/NotesContext";

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
    render: (props) => {
      const { currentCampaign } = useNotes();
      const tag = useQuery(api.tags.queries.getTag, {
        campaignId: currentCampaign?._id,
        tagId: props.inlineContent.props.tagId,
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
    },
  },
);
