import { Id } from "../_generated/dataModel";
import { Tag } from "../tags/types";

export type Location = Tag & {
  locationId: Id<"locations">
}