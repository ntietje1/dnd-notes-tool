import type { Tag } from "convex/tags/types";
import type { LucideIcon } from "~/lib/icons";


export const MAX_NAME_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 1000;

export interface TagCategoryConfig {
    singular: string;
    plural: string;
    icon: LucideIcon;
    categoryName: string;
}

export interface BaseTagFormValues {
    name: string;
    description: string;
    color: string;
}

export const defaultBaseFormValues: BaseTagFormValues = {
    name: "",
    description: "",
    color: "#ef4444",
}

export interface TagDialogProps<T extends Tag = Tag> {
    mode: "create" | "edit";
    isOpen: boolean;
    onClose: () => void;
    config: TagCategoryConfig;
    tag?: T;
    navigateToNote?: boolean;
}
  