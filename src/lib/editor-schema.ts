import {
  type Block,
  BlockNoteEditor,
  defaultBlockSpecs,
  defaultInlineContentSpecs,
  defaultStyleSpecs,
  type BlockSchemaFromSpecs,
  type InlineContentSchemaFromSpecs,
  type StyleSchemaFromSpecs,
} from "@blocknote/core";
import { TagInlineContent } from "~/components/editor/tag-inline-content";

export const customInlineContentSpecs = {
  ...defaultInlineContentSpecs,
  tag: TagInlineContent,
};

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
