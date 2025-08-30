import { useNotes } from "~/contexts/NotesContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useComponentsContext } from "@blocknote/react";
import { SYSTEM_TAGS } from "convex/tags/types";
import { Share2 } from "~/lib/icons";
import { toast } from "sonner";
import type { CustomBlock } from "~/lib/editor-schema";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useCampaign } from "~/contexts/CampaignContext";

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

  const sharedTag = useQuery(convexQuery(
    api.tags.queries.getSystemTagByName,
    campaign?._id
      ? {
          campaignId: campaign._id,
          name: SYSTEM_TAGS.shared,
        }
      : "skip",
  ));

  const blockTagState = useQuery(convexQuery(api.notes.queries.getBlockTagState, note?._id ? {
    noteId: note._id,
    blockId: block.id,
  } : "skip"));

  const addTagToBlock = useMutation({mutationFn: useConvexMutation(api.notes.mutations.addTagToBlockMutation)});
  const removeTagFromBlock = useMutation({mutationFn: useConvexMutation(api.notes.mutations.removeTagFromBlockMutation)});

  const isShared =
    sharedTag.data && blockTagState.data?.allTagIds.includes(sharedTag.data._id);

  const handleToggleShare = async () => {
    if (!note || !sharedTag.data) return;

    try {
      if (isShared) {
        await removeTagFromBlock.mutateAsync({
          noteId: note._id,
          blockId: block.id,
          tagId: sharedTag.data._id,
        });
      } else {
        await addTagToBlock.mutateAsync({
          noteId: note._id,
          blockId: block.id,
          tagId: sharedTag.data._id,
        });
      }
    } catch (error) {
      console.error("Failed to toggle share:", error);
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
