import {
  defaultInlineContentSpecs,
  BlockSchemaFromSpecs,
  defaultBlockSpecs,
  InlineContentSchemaFromSpecs,
  StyleSchemaFromSpecs,
  defaultStyleSpecs,
  Block,
} from '@blocknote/core'
import { TagInlineSpecType } from '../tags/editorSpecs'

type CustomInlineContentSpecs = typeof defaultInlineContentSpecs &
  TagInlineSpecType

export type CustomBlock = Block<
  BlockSchemaFromSpecs<typeof defaultBlockSpecs>,
  InlineContentSchemaFromSpecs<CustomInlineContentSpecs>,
  StyleSchemaFromSpecs<typeof defaultStyleSpecs>
>
