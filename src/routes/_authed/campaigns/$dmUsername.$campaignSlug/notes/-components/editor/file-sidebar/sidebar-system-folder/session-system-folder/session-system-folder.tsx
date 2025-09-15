import { Calendar } from "~/lib/icons";
import { GenericCategoryFolder } from "../generic-category-folder/generic-category-folder";
import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";

export const SessionSystemFolder = () => {
  return (
    <GenericCategoryFolder
      categoryName={SYSTEM_TAG_CATEGORY_NAMES.Session}
      icon={<Calendar className="h-4 w-4 shrink-0" />}
    />
  );
};