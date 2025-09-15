import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";
import { CharacterCategoryFolder } from "./character-system-folder/character-category-folder";
import { SessionSystemFolder } from "./session-system-folder/session-system-folder";
import { LocationCategoryFolder } from "./location-system-folder/location-category-folder";

interface SystemFolderButtonProps {
  tagCategory: string;
}

export const SystemFolderButton = ({
  tagCategory,
}: SystemFolderButtonProps) => {
  
  switch (tagCategory) {
    case SYSTEM_TAG_CATEGORY_NAMES.Character:
      return (
        <CharacterCategoryFolder />
      );
    case SYSTEM_TAG_CATEGORY_NAMES.Location:
      return (
        <LocationCategoryFolder />
      );
    case SYSTEM_TAG_CATEGORY_NAMES.Session:
      return (
        <SessionSystemFolder />
      );
    default:
      throw new Error(`Unknown tag type attempted to render: ${tagCategory}`);
  }
};
