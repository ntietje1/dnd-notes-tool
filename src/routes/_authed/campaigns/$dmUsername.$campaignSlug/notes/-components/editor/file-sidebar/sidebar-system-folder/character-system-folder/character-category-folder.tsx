import { CategoryFolderButton } from "../generic-category-folder/category-folder-button";
import { CharacterCategoryFolderContextMenu } from "./character-category-context-menu";
import { CharacterNoteContextMenu } from "./character-note-context-menu";
import { CHARACTER_CONFIG } from "~/components/forms/category-tag-dialogs/character-tag-dialog/types";

interface CharacterCategoryFolderProps {}

export const CharacterCategoryFolder = ({}: CharacterCategoryFolderProps) => {
  return (
    <CategoryFolderButton
      categoryConfig={CHARACTER_CONFIG}
      categoryContextMenu={CharacterCategoryFolderContextMenu}
      tagNoteContextMenu={CharacterNoteContextMenu}
    />
  );
};
