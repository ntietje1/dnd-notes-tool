import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { FormDialog } from "~/components/forms/form-dialog";
import { useCampaign } from "~/contexts/CampaignContext";
import { Plus } from "~/lib/icons";


export interface GenericTagCreateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    navigateToNote?: boolean;
}

export const GenericTagCreateDialog = ({ isOpen, onClose, navigateToNote }: GenericTagCreateDialogProps) => {
    const { campaignWithMembership } = useCampaign();
    const campaign = campaignWithMembership?.data?.campaign;
    const createTag = useMutation({ mutationFn: useConvexMutation(api.tags.mutations.createTag) });

    return (
        <FormDialog
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Item"
            description="Create a new item"
            icon={Plus}
        >
            <div>Create a new item</div>
        </FormDialog>
    )
};
