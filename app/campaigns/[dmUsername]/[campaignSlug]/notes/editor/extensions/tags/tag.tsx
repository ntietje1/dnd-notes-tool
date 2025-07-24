import { createReactInlineContentSpec } from "@blocknote/react";
import { TagType } from "@/convex/tags/types";

// The Tag inline content specification
export const TagInlineContent = createReactInlineContentSpec(
  {
    type: "tag",
    propSchema: {
      name: {
        default: "",
      },
      type: {
        default: "custom" as TagType,
      },
      color: {
        default: "#ff004a",
      },
    },
    content: "none",
  },
  {
    render: (props) => (
      <div
        className="relative inline-flex items-center rounded-full px-1.5 text-sm font-medium pb-0.5"
        style={{
          backgroundColor: `${props.inlineContent.props.color}15`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full mix-blend-multiply"
          style={{
            backgroundColor: `${props.inlineContent.props.color}20`,
          }}
        />
        <span className="opacity-85">@{props.inlineContent.props.name}</span>
      </div>
    ),
  },
);
