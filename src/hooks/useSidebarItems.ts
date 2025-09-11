import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useCampaign } from "~/contexts/CampaignContext";
import type { Id } from "convex/_generated/dataModel";
import { SORT_DIRECTIONS, SORT_ORDERS, type SortOptions } from "convex/editors/types";
import type { AnySidebarItem } from "convex/notes/types";
import { useSortOptions } from "./useSortOptions";

export const useSidebarItems = (parentId?: Id<"folders">) => {
    const { sortOptions } = useSortOptions();
    const { campaignWithMembership } = useCampaign();
    const campaign = campaignWithMembership?.data?.campaign;
    const sidebarItems = useQuery(convexQuery(
        api.notes.queries.getSidebarItems,
        campaign?._id ? {
            campaignId: campaign._id,
            parentId: parentId
        } : "skip",
    ));
    return { ...sidebarItems, data: sortItemsByOptions(sortOptions, sidebarItems.data) };
};


export const sortItemsByOptions = (options: SortOptions, items?: AnySidebarItem[]) => {
    if (!items) return undefined;
    return items.sort((a, b) => {
        if (
          options.foldersAlwaysOnTop &&
          a.type === "folders" &&
          b.type !== "folders"
        ) {
          return -1;
        }
        if (
          options.foldersAlwaysOnTop &&
          a.type !== "folders" &&
          b.type === "folders"
        ) {
          return 1;
        }
        switch (options.order) {
          case SORT_ORDERS.Alphabetical:
            const nameA = a.name || "";
            const nameB = b.name || "";
            return options.direction === SORT_DIRECTIONS.Ascending
              ? nameA.localeCompare(nameB)
              : nameB.localeCompare(nameA);
          case SORT_ORDERS.DateCreated:
            return options.direction === SORT_DIRECTIONS.Ascending
              ? a._creationTime - b._creationTime
              : b._creationTime - a._creationTime;
          case SORT_ORDERS.DateModified:
            return options.direction === SORT_DIRECTIONS.Ascending
              ? a.updatedAt - b.updatedAt
              : b.updatedAt - a.updatedAt;
          default:
            return 0;
        }
    });
}
