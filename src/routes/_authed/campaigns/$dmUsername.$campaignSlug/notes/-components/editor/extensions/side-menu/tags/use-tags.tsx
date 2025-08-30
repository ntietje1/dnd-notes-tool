import { useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import type { Tag, TagType } from "convex/tags/types";
import { toast } from "sonner";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useCampaign } from "~/contexts/CampaignContext";

export function useTags() {
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;
  const tags = useQuery(
    convexQuery(api.tags.queries.getTags, campaign?._id ? { campaignId: campaign._id } : "skip"),
  );
  const createTag = useMutation({mutationFn: useConvexMutation(api.tags.mutations.createTag)});
  const deleteTag = useMutation({mutationFn: useConvexMutation(api.tags.mutations.deleteTag)});
  const addTagToBlock = useMutation({mutationFn: useConvexMutation(api.notes.mutations.addTagToBlockMutation)});
  const removeTagFromBlock = useMutation({mutationFn: useConvexMutation(
    api.notes.mutations.removeTagFromBlockMutation,
  )});

  const handleCreateTag = useCallback(
    async (name: string, type: TagType, color: string) => {
      if (!campaign?._id) {
        toast.error("Still loading... Try again in a moment");
        return;
      }
      return await createTag.mutateAsync({
        name,
        type,
        color,
        campaignId: campaign._id,
      });
    },
    [createTag, campaign],
  );

  const handleDeleteTag = useCallback(
    async (tagId: Id<"tags">) => {
      return await deleteTag.mutateAsync({ tagId });
    },
    [deleteTag],
  );

  const handleAddTagToBlock = useCallback(
    async (noteId: Id<"notes">, blockId: string, tagId: Id<"tags">) => {
      return await addTagToBlock.mutateAsync({
        noteId,
        blockId,
        tagId,
      });
    },
    [addTagToBlock],
  );

  const handleRemoveTagFromBlock = useCallback(
    async (noteId: Id<"notes">, blockId: string, tagId: Id<"tags">) => {
      return await removeTagFromBlock.mutateAsync({
        noteId,
        blockId,
        tagId,
      });
    },
    [removeTagFromBlock],
  );

  return {
    tags: tags.data?.filter((tag: Tag) => tag.type !== "System") || [],
    createTag: handleCreateTag,
    deleteTag: handleDeleteTag,
    addTagToBlock: handleAddTagToBlock,
    removeTagFromBlock: handleRemoveTagFromBlock,
  };
}
