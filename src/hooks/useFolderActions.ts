import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "convex/_generated/api";

export const useFolderActions = () => {
    const updateFolder = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.updateFolder) });
    const createFolder = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.createFolder) });
    const deleteFolder = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.deleteFolder) });
    const moveFolder = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.moveFolder) });


    return {
        updateFolder,
        createFolder,
        deleteFolder,
        moveFolder,
    }
}