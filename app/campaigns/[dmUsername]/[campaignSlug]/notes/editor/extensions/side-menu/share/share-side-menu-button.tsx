import React from "react";
import { useNotes } from "@/contexts/NotesContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useComponentsContext } from "@blocknote/react";
import { SYSTEM_TAGS } from "@/convex/tags/types";
import { Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { CustomBlock } from "@/lib/tags";

interface ShareSideMenuButtonProps {
  block: CustomBlock;
}

export default function ShareSideMenuButton({
  block,
}: ShareSideMenuButtonProps) {
  const { currentCampaign, currentNote } = useNotes();

  const Components = useComponentsContext()!;

  // Get the shared tag for this campaign
  const sharedTag = useQuery(
    api.tags.queries.getSystemTagByName,
    currentCampaign?._id
      ? {
          campaignId: currentCampaign._id,
          name: SYSTEM_TAGS.shared,
        }
      : "skip",
  );

  // Get current block tag state
  const blockTagState = useQuery(api.notes.queries.getBlockTagState, currentNote?._id ? {
    noteId: currentNote._id,
    blockId: block.id,
  } : "skip");

  const addTagToBlock = useMutation(api.notes.mutations.addTagToBlockMutation);
  const removeTagFromBlock = useMutation(
    api.notes.mutations.removeTagFromBlockMutation,
  );

  const isShared =
    sharedTag && blockTagState?.allTagIds.includes(sharedTag._id);

  const handleToggleShare = async () => {
    if (!currentNote || !sharedTag) return;

    try {
      if (isShared) {
        await removeTagFromBlock({
          noteId: currentNote._id,
          blockId: block.id,
          tagId: sharedTag._id,
        });
      } else {
        await addTagToBlock({
          noteId: currentNote._id,
          blockId: block.id,
          tagId: sharedTag._id,
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
      icon={<Share2Icon size={18} />}
    />
  );
}
