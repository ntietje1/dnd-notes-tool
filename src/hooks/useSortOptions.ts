import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { SORT_DIRECTIONS, SORT_ORDERS, type SortOptions } from "convex/editors/types";
import { useCallback, useState } from "react";
import { useCampaign } from "~/contexts/CampaignContext";

const defaultSortOptions: SortOptions = {
    order: SORT_ORDERS.DateCreated,
    direction: SORT_DIRECTIONS.Descending,
    foldersAlwaysOnTop: false,
};

export const useSortOptions = () => {
    const { campaignWithMembership } = useCampaign();
    const campaign = campaignWithMembership?.data?.campaign;
    const currentEditor = useQuery(convexQuery(api.editors.queries.getCurrentEditor, campaign?._id ? { campaignId: campaign._id } : "skip"));
    const setCurrentEditor = useMutation({ mutationFn: useConvexMutation(api.editors.mutations.setCurrentEditor) });

    const [sortOptions, setSortOptions] = useState(defaultSortOptions);

    const setSortOptionsAction = useCallback(async (options: SortOptions) => {
        setSortOptions(options);
        if (!campaign?._id) return;
        await setCurrentEditor.mutateAsync({
            campaignId: campaign._id,
            sortOrder: options.order,
            sortDirection: options.direction,
            foldersAlwaysOnTop: options.foldersAlwaysOnTop,
        });
    }, [campaign?._id, setCurrentEditor]);

    return {
        currentEditor,
        sortOptions,
        setSortOptions: setSortOptionsAction,
    }
}