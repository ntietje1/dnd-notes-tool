import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { TagType } from "@/convex/tags/types";
import { getNoteTags } from "@/convex/tags/queries";

export function useTags(campaignId?: Id<"campaigns">) {
  const tags = useQuery(api.tags.queries.getTags, { campaignId });
  const createTag = useMutation(api.tags.mutations.createTag);
  const deleteTag = useMutation(api.tags.mutations.deleteTag);
  const addTagToNote = useMutation(api.tags.mutations.addTagToNote);
  const removeTagFromNote = useMutation(api.tags.mutations.removeTagFromNote);

  const handleCreateTag = useCallback(
    async (name: string, type: TagType, color: string) => {
      return await createTag({ name, type, color, campaignId: campaignId! });
    },
    [createTag, campaignId],
  );

  const handleDeleteTag = useCallback(
    async (tagId: Id<"tags">) => {
      return await deleteTag({ tagId });
    },
    [deleteTag],
  );

  const handleAddTagToNote = useCallback(
    async (noteId: Id<"notes">, tagId: Id<"tags">) => {
      return await addTagToNote({ noteId, tagId });
    },
    [addTagToNote],
  );

  const handleRemoveTagFromNote = useCallback(
    async (noteId: Id<"notes">, tagId: Id<"tags">) => {
      return await removeTagFromNote({ noteId, tagId });
    },
    [removeTagFromNote],
  );

  return {
    tags,
    createTag: handleCreateTag,
    deleteTag: handleDeleteTag,
    addTagToNote: handleAddTagToNote,
    removeTagFromNote: handleRemoveTagFromNote,
  };
}
