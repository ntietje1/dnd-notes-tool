import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useState } from "react";
import { useSortOptions } from "./useSortOptions";
import { sortItemsByOptions } from "./useSidebarItems";


export const useTogglableFolder = (folderId: Id<"folders">) => {
    const { sortOptions } = useSortOptions();
    const folder = useQuery(convexQuery(
        api.notes.queries.getFolder,
        { folderId },
    ));
    const [expanded, setExpanded] = useState(false); //TODO: persist this to database & set cache to indefinite
    const folderWithSortedChildren = folder.data?.children !== undefined ? {
        ...folder,
            data: {
                ...folder.data,
                children: sortItemsByOptions(sortOptions, folder.data?.children)
            }
        } : undefined;
    return {
        folder: folderWithSortedChildren,
        expanded,
        setExpanded,
    };
}