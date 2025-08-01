import React, { useState } from "react";
import { useNotes } from "@/contexts/NotesContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CustomBlockNoteEditor } from "./tags";
import { useComponentsContext } from "@blocknote/react";
import { SYSTEM_TAGS } from "@/convex/tags/types";
import { Share2Icon } from "lucide-react";

interface ShareSideMenuButtonProps {
  editor: CustomBlockNoteEditor;
  block: any;
}

export default function ShareSideMenuButton({
  editor,
  block,
}: ShareSideMenuButtonProps) {
  const { currentCampaign, currentNote } = useNotes();
  const [isSharing, setIsSharing] = useState(false);

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
  const blockTagState = useQuery(api.notes.queries.getBlockTagState, {
    noteId: currentNote?._id!,
    blockId: block.id,
  });

  const addTagToBlock = useMutation(api.notes.mutations.addTagToBlockMutation);
  const removeTagFromBlock = useMutation(
    api.notes.mutations.removeTagFromBlockMutation,
  );

  const isShared =
    sharedTag && blockTagState?.allTagIds.includes(sharedTag._id);

  const handleToggleShare = async () => {
    if (!currentNote || !sharedTag) return;

    setIsSharing(true);
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
      alert(error instanceof Error ? error.message : "Failed to toggle share");
    } finally {
      setIsSharing(false);
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
