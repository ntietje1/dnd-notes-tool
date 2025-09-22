import { Character } from "./types";
import { Id } from "../_generated/dataModel";

export const combineCharacterAndTag = (
  character: { _id: Id<"characters"> }, 
  tag: { _id: Id<"tags"> }
): Character => {
  return { ...character, ...tag, tagId: tag._id, characterId: character._id } as Character;
};