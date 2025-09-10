import { Id } from "../_generated/dataModel";
import { SYSTEM_TAG_CATEGORY_NAMES, Tag } from "../tags/types";

export type Character = (Tag & { type: typeof SYSTEM_TAG_CATEGORY_NAMES.Character }) & {
  characterId: Id<"characters">
};
