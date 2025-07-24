import { TagInlineContent } from "@/app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tag";
import {
  Block,
  BlockNoteEditor,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
  type BlockSchemaFromSpecs,
  type InlineContentSchemaFromSpecs,
  type StyleSchemaFromSpecs,
} from "@blocknote/core";

// Define custom inline content specs
export const customInlineContentSpecs = {
  ...defaultInlineContentSpecs,
  tag: TagInlineContent,
} as const;

// Create type for custom blocks
export type CustomBlock = Block<
  BlockSchemaFromSpecs<typeof defaultBlockSpecs>,
  InlineContentSchemaFromSpecs<typeof customInlineContentSpecs>,
  StyleSchemaFromSpecs<typeof defaultStyleSpecs>
>;

// Create type for the custom editor
export type CustomBlockNoteEditor = BlockNoteEditor<
  BlockSchemaFromSpecs<typeof defaultBlockSpecs>,
  InlineContentSchemaFromSpecs<typeof customInlineContentSpecs>,
  StyleSchemaFromSpecs<typeof defaultStyleSpecs>
>;
