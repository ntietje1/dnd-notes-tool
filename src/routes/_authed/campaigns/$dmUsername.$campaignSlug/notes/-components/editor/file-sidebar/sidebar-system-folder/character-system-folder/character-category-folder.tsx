import { User } from "~/lib/icons";
import { GenericCategoryFolder } from "../generic-category-folder/generic-category-folder";
import { CharacterCategoryFolderContextMenu } from "./character-category-context-menu";
import { CharacterNoteContextMenu } from "./character-note-context-menu";
import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";

interface CharacterCategoryFolderProps {}

export const CharacterCategoryFolder = ({}: CharacterCategoryFolderProps) => {
  return (
    <GenericCategoryFolder
      categoryName={SYSTEM_TAG_CATEGORY_NAMES.Character}
      icon={<User className="h-4 w-4 shrink-0" />}
      categoryContextMenu={CharacterCategoryFolderContextMenu}
      noteContextMenu={CharacterNoteContextMenu}
    />
  );
};
