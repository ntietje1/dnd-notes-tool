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
import { TagInlineContent } from "./tag-inline-content";

// Define custom inline content specs
export const customInlineContentSpecs = {
  ...defaultInlineContentSpecs,
  tag: TagInlineContent,
} as const;

export type CustomBlock = Block<
  BlockSchemaFromSpecs<typeof defaultBlockSpecs>,
  InlineContentSchemaFromSpecs<typeof customInlineContentSpecs>,
  StyleSchemaFromSpecs<typeof defaultStyleSpecs>
>;

export type CustomBlockNoteEditor = BlockNoteEditor<
  BlockSchemaFromSpecs<typeof defaultBlockSpecs>,
  InlineContentSchemaFromSpecs<typeof customInlineContentSpecs>,
  StyleSchemaFromSpecs<typeof defaultStyleSpecs>
>;
