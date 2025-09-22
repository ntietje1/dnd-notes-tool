import { CategoryFolderButton } from "../generic-category-folder/category-folder-button";
import { LocationNoteContextMenu } from "./location-note-context-menu";
import { LocationCategoryFolderContextMenu } from "./location-category-context-menu";
import { LOCATION_CONFIG } from "~/components/forms/category-tag-dialogs/location-tag-dialog/types";

interface LocationCategoryFolderProps {}

export const LocationCategoryFolder = ({}: LocationCategoryFolderProps) => {
  return (
    <CategoryFolderButton
      categoryConfig={LOCATION_CONFIG}
      categoryContextMenu={LocationCategoryFolderContextMenu}
      tagNoteContextMenu={LocationNoteContextMenu}
    />
  );
};
