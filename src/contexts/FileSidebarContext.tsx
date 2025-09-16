
import type { Id } from "convex/_generated/dataModel";
import type { AnySidebarItem } from "convex/notes/types";
import { createContext, useCallback, useContext, useState } from "react";
import usePersistedState from "~/hooks/usePersistedState";
import { useFolderActions } from "~/hooks/useFolderActions";
import { useNoteActions } from "~/hooks/useNoteActions";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";



type FileSidebarContextType = {
    setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
    renamingId: Id<"folders"> | Id<"notes"> | null;
    setDeletingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
    deletingId: Id<"folders"> | Id<"notes"> | null;

    folderStates: Record<string, boolean>;
    setFolderState: (folderId: string, isOpen: boolean) => void;
    openFolder: (folderId: string) => void;
    closeFolder: (folderId: string) => void;
    activeDragItem: AnySidebarItem | null;
};

const FileSidebarContext = createContext<FileSidebarContextType | null>(null);

export function FileSidebarProvider({ children }: { children: React.ReactNode }) {
    const [renamingId, setRenamingId] = useState<Id<"folders"> | Id<"notes"> | null>(null);
    const [deletingId, setDeletingId] = useState<Id<"folders"> | Id<"notes"> | null>(null);
    
    const [folderStates, setFolderStates] = usePersistedState<Record<string, boolean>>(
        'file-sidebar-folder-states',
        {}
    );
    
    const { moveFolder } = useFolderActions();
    const { moveNote } = useNoteActions();

    const [activeDragItem, setActiveDragItem] = useState<AnySidebarItem | null>(null);
    
    const setFolderState = useCallback((folderId: string, isOpen: boolean) => {
        setFolderStates(prev => ({
            ...prev,
            [folderId]: isOpen
        }));
    }, [setFolderStates]);
    
    const openFolder = useCallback((folderId: string) => {
        setFolderState(folderId, true);
    }, [setFolderState]);
    
    const closeFolder = useCallback((folderId: string) => {
        setFolderState(folderId, false);
    }, [setFolderState]);
    
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
            distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
            delay: 250,
            tolerance: 5,
            },
        }),
    );

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const { active } = event;
            const item = active.data.current as AnySidebarItem;
            if (item) {
                setActiveDragItem(item);
            }
        },
        [],
    );

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveDragItem(null);

            if (!active.data.current || !over) return;

            const draggedItem = active.data.current as AnySidebarItem;

            if (draggedItem.type === "notes") {
                let parentFolderId: Id<"folders"> | undefined = undefined;

                if (over && over.id !== "root") {
                    parentFolderId = over.id as Id<"folders">;
                    openFolder(parentFolderId);
                }

                await moveNote.mutateAsync({ noteId: draggedItem._id, parentFolderId });
            }

            if (draggedItem.type === "folders") {
                if (over.id === draggedItem._id) {
                    return;
                }

                let parentId: Id<"folders"> | undefined = undefined;
                if (over.id !== "root") {
                    parentId = over.id as Id<"folders">;
                }

                await moveFolder.mutateAsync({ folderId: draggedItem._id, parentId: parentId });
            }
        },
    [moveNote, moveFolder, openFolder],
    );

    const value: FileSidebarContextType = {
        renamingId,
        setRenamingId,
        deletingId,
        setDeletingId,
        folderStates,
        setFolderState,
        openFolder,
        closeFolder,
        activeDragItem,
    };

    return (
    <FileSidebarContext.Provider value={value}>
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {children}
        </DndContext>
    </FileSidebarContext.Provider>
    );
}

export const useFileSidebar = () => {
    const context = useContext(FileSidebarContext);
    if (!context) {
        throw new Error("useFileSidebar must be used within a FileSidebarProvider");
    }
    return context;
};
