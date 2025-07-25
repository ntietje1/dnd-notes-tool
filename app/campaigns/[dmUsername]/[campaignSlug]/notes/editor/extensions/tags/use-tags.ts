import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TagType } from "@/convex/tags/types";
import { useNotes } from "@/contexts/NotesContext";

export function useTags() {
  const { currentCampaign } = useNotes();
  const tags = useQuery(api.tags.queries.getTags, {
    campaignId: currentCampaign?._id,
  });
  const createTag = useMutation(api.tags.mutations.createTag);
  const deleteTag = useMutation(api.tags.mutations.deleteTag);

  const handleCreateTag = useCallback(
    async (name: string, type: TagType, color: string) => {
      return await createTag({
        name,
        type,
        color,
        campaignId: currentCampaign?._id!,
      });
    },
    [createTag, currentCampaign],
  );

  const handleDeleteTag = useCallback(
    async (tagId: Id<"tags">) => {
      return await deleteTag({ tagId });
    },
    [deleteTag],
  );

  return {
    tags,
    createTag: handleCreateTag,
    deleteTag: handleDeleteTag,
  };
}
