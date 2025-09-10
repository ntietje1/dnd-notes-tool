import { Id } from "../_generated/dataModel";
import { Tag, SYSTEM_TAG_CATEGORY_NAMES } from "../tags/types";

export type Location = (Tag & { type: typeof SYSTEM_TAG_CATEGORY_NAMES.Location }) & {
  locationId: Id<"locations">
}