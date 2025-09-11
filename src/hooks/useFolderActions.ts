import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";
import { useCallback } from "react";
import type { Id } from "convex/_generated/dataModel";

export const useFolderActions = () => {
    const updateFolder = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.updateFolder) });
    const createFolder = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.createFolder) });
    const deleteFolder = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.deleteFolder) });
    const moveFolder = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.moveFolder) });

    const renameFolder = useCallback(async (folderId: Id<"folders">, name: string) => {
        await updateFolder.mutateAsync({ folderId, name });
    }, [updateFolder]);

    return {
        renameFolder,
        createFolder,
        deleteFolder,
        moveFolder,
    }
}