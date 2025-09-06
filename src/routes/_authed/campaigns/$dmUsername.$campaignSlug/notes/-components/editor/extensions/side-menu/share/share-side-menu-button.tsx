import { useNotes } from "~/contexts/NotesContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useComponentsContext } from "@blocknote/react";
import { Share2 } from "~/lib/icons";
import { toast } from "sonner";
import type { CustomBlock } from "~/lib/editor-schema";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useCampaign } from "~/contexts/CampaignContext";
import type { Tag } from "convex/tags/types";

interface ShareSideMenuButtonProps {
  block: CustomBlock;
}

export default function ShareSideMenuButton({
  block,
}: ShareSideMenuButtonProps) {
  const { note } = useNotes();
  const { campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;

  const Components = useComponentsContext()!;

  const blockTagState = useQuery(convexQuery(api.notes.queries.getBlockTagState, note?._id ? {
    noteId: note._id,
    blockId: block.id,
  } : "skip"));

  const addTagToBlock = useMutation({mutationFn: useConvexMutation(api.notes.mutations.addTagToBlockMutation)});
  const removeTagFromBlock = useMutation({mutationFn: useConvexMutation(api.notes.mutations.removeTagFromBlockMutation)});

  const sharedTagQueryResult = useQuery(convexQuery(
    api.tags.queries.getSharedTags,
    campaign?._id ? { campaignId: campaign._id } : "skip",
  ));
  const { sharedAllTag, playerSharedTags } = sharedTagQueryResult.data || {};

  const isShared =
    sharedAllTag && playerSharedTags && (
      blockTagState.data?.allTagIds.includes(sharedAllTag._id) ||
      playerSharedTags.some((tag: Tag) => blockTagState.data?.allTagIds.includes(tag._id))
    );

  const handleToggleShare = async () => {
    if (!note || !sharedAllTag) return;

    try {
      if (isShared) {
        await removeTagFromBlock.mutateAsync({
          noteId: note._id,
          blockId: block.id,
          tagId: sharedAllTag._id,
        });
      } else {
        await addTagToBlock.mutateAsync({
          noteId: note._id,
          blockId: block.id,
          tagId: sharedAllTag._id,
        });
      }
    } catch (error) {
      toast.error("Failed to toggle share");
    }
  };

  return (
    <Components.SideMenu.Button
      label={isShared ? "Unshare Block" : "Share Block"}
      className={`!p-0 !px-0 !h-6 !w-6 ${isShared ? "!text-blue-600" : ""}`}
      onClick={handleToggleShare}
      icon={<Share2 size={18} />}
    />
  );
}
