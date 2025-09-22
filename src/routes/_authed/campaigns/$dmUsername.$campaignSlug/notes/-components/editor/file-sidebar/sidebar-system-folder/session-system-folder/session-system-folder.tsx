import { Calendar } from "~/lib/icons";
import { CategoryFolderButton } from "../generic-category-folder/category-folder-button";
import { SYSTEM_TAG_CATEGORY_NAMES } from "convex/tags/types";
import type { TagCategoryConfig } from "~/components/forms/category-tag-dialogs/base-tag-dialog/types";

export const SESSION_CONFIG: TagCategoryConfig = {
  categoryName: SYSTEM_TAG_CATEGORY_NAMES.Session,
  singular: "Session",
  plural: "Sessions",
  icon: Calendar,
}

export const SessionSystemFolder = () => {
  return (
    <CategoryFolderButton
      categoryConfig={SESSION_CONFIG}
    />
  );
};