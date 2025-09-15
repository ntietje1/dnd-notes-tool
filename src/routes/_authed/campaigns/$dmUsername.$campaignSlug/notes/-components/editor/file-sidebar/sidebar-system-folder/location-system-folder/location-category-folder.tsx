import { MapPin } from "~/lib/icons";
import { GenericCategoryFolder } from "../generic-category-folder/generic-category-folder";
import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";
import { LocationNoteContextMenu } from "./location-note-context-menu";
import { LocationCategoryFolderContextMenu } from "./location-category-context-menu";

interface LocationCategoryFolderProps {}

export const LocationCategoryFolder = ({}: LocationCategoryFolderProps) => {
  return (
    <GenericCategoryFolder
      categoryName={SYSTEM_TAG_CATEGORY_NAMES.Location}
      icon={<MapPin className="h-4 w-4 shrink-0" />}
      categoryContextMenu={LocationCategoryFolderContextMenu}
      noteContextMenu={LocationNoteContextMenu}
    />
  );
};
