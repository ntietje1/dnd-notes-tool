import { Id } from "../_generated/dataModel";
import { Tag } from "../tags/types";

export type Character = Tag & {
  characterId: Id<"characters">
};
