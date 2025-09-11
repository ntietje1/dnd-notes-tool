import { api } from "convex/_generated/api";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Id } from "convex/_generated/dataModel";
import type { CustomBlock } from "~/lib/editor-schema";
import { useCampaign } from "~/contexts/CampaignContext";


export const useNoteActions = () => {
    const { campaignWithMembership } = useCampaign();
    const updateNote = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.updateNote) });
    const createNote = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.createNote) });
    const deleteNote = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.deleteNote) });
    const moveNote = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.moveNote) });

    const renameNote = useCallback(async (noteId: Id<"notes">, name: string) => {
        await updateNote.mutateAsync({ noteId, name });
    }, [updateNote]);

    const updateNoteContent = useCallback(
        async (noteId: Id<"notes">, newContent: CustomBlock[]) => {    
            const sanitizedContent = sanitizeNoteContent(newContent);
            await updateNote.mutateAsync({
                noteId,
                content: sanitizedContent,
            });
        },
        [updateNote],
    );

    const createNoteAction = useCallback(async (parentFolderId?: Id<"folders">) => {
        if (!campaignWithMembership?.data?.campaign?._id) return;
        await createNote.mutateAsync({
            campaignId: campaignWithMembership?.data?.campaign?._id,
            parentFolderId,
        });
    }, [createNote]);

    return {
        createNote: createNoteAction,
        deleteNote,
        moveNote,
        renameNote,
        updateNoteContent,
    }
}

// remove undefined values (caused issues with undefined values in tables)
const sanitizeNoteContent = (node: any): any => {
    if (typeof node === "string") {
        return node;
    }
    if (Array.isArray(node)) {
        return node.map(sanitizeNoteContent);
    }
    if (node && typeof node === "object") {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(node)) {
            if (key !== "_id" && key !== "__typename") {
                sanitized[key] = sanitizeNoteContent(value);
            }
        }
        return sanitized;
    }
    return node;
  };