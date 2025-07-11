"use client";

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useState,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Note, SidebarData } from "@/convex/types";
import { Editor } from "@tiptap/core";

type NotesContextType = {
  // State
  currentNoteId: Id<"notes"> | null | undefined;
  selectedNote: Note | null | undefined;
  expandedFolders: Set<Id<"folders">>;
  sidebarData: SidebarData | undefined;

  // Actions
  selectNote: (noteId: Id<"notes">) => void;
  updateNoteContent: (editor: Editor) => Promise<void>;
  updateNoteTitle: (title: string) => Promise<void>;
  toggleFolder: (folderId: Id<"folders">) => void;
  openFolder: (folderId: Id<"folders">) => void;
  createNote: () => Promise<void>;
  createFolder: () => Promise<void>;
  deleteNote: (noteId: Id<"notes">) => Promise<void>;
  deleteFolder: (folderId: Id<"folders">) => Promise<void>;
  moveNote: (noteId: Id<"notes">, folderId?: Id<"folders">) => Promise<void>;
  moveFolder: (
    folderId: Id<"folders">,
    parentId?: Id<"folders">,
  ) => Promise<void>;
  updateFolderName: (folderId: Id<"folders">, name: string) => Promise<void>;
};

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  // Local state
  const [expandedFolders, setExpandedFolders] = useState<Set<Id<"folders">>>(
    new Set(),
  );

  // Queries
  const currentEditor = useQuery(api.notes.getCurrentEditor);
  const selectedNote = useQuery(api.notes.getNote, {
    noteId: currentEditor?.noteId,
  });
  const sidebarData = useQuery(api.notes.getSidebarData, {});

  // Mutations
  const setCurrentEditor = useMutation(api.notes.setCurrentEditor);
  const updateNote = useMutation(api.notes.updateNote);
  const createNoteAction = useMutation(api.notes.createNote);
  const createFolderAction = useMutation(api.notes.createFolder);
  const deleteNoteAction = useMutation(api.notes.deleteNote);
  const deleteFolderAction = useMutation(api.notes.deleteFolder);
  const moveFolderAction = useMutation(
    api.notes.moveFolder,
  ).withOptimisticUpdate((store, { folderId, parentId }) => {
    const sidebarData = store.getQuery(api.notes.getSidebarData, {});
    if (!sidebarData) return;

    const updatedFolders = sidebarData.folders.map((folder) =>
      folder._id === folderId ? { ...folder, folderId: parentId } : folder,
    );

    store.setQuery(
      api.notes.getSidebarData,
      {},
      {
        ...sidebarData,
        folders: updatedFolders,
      },
    );
  });

  const moveNoteAction = useMutation(api.notes.moveNote).withOptimisticUpdate(
    (store, { noteId, folderId }) => {
      const sidebarData = store.getQuery(api.notes.getSidebarData, {});
      if (!sidebarData) return;

      const updatedNotes = sidebarData.notes.map((note) =>
        note._id === noteId ? { ...note, folderId } : note,
      );

      store.setQuery(
        api.notes.getSidebarData,
        {},
        {
          ...sidebarData,
          notes: updatedNotes,
        },
      );
    },
  );
  const updateFolder = useMutation(api.notes.updateFolder).withOptimisticUpdate(
    (store, { folderId, name }) => {
      const sidebarData = store.getQuery(api.notes.getSidebarData, {});
      if (!sidebarData) return;

      const updatedFolders = sidebarData.folders.map((folder) =>
        folder._id === folderId ? { ...folder, name: name || "" } : folder,
      );

      store.setQuery(
        api.notes.getSidebarData,
        {},
        {
          ...sidebarData,
          folders: updatedFolders,
        },
      );
    },
  );

  // Actions
  const selectNote = useCallback(
    (noteId: Id<"notes">) => {
      setCurrentEditor({ noteId });
    },
    [setCurrentEditor],
  );

  const updateNoteContent = useCallback(
    async (editor: Editor) => {
      if (!selectedNote?._id) return;
      const content = editor.getJSON();
      await updateNote({ noteId: selectedNote._id, content });
    },
    [selectedNote?._id, updateNote],
  );

  const updateNoteTitle = useCallback(
    async (title: string) => {
      if (!selectedNote?._id) return;
      await updateNote({ noteId: selectedNote._id, title });
    },
    [selectedNote?._id, updateNote],
  );

  const toggleFolder = useCallback((folderId: Id<"folders">) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const openFolder = useCallback((folderId: Id<"folders">) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.add(folderId);
      return next;
    });
  }, []);

  const createNote = useCallback(async () => {
    await createNoteAction({});
  }, [createNoteAction]);

  const createFolder = useCallback(async () => {
    await createFolderAction({});
  }, [createFolderAction]);

  const deleteNote = useCallback(
    async (noteId: Id<"notes">) => {
      await deleteNoteAction({ noteId });
      if (currentEditor?.noteId === noteId) {
        await setCurrentEditor({ noteId: undefined });
      }
    },
    [deleteNoteAction],
  );

  const deleteFolder = useCallback(
    async (folderId: Id<"folders">) => {
      await deleteFolderAction({ folderId });
    },
    [deleteFolderAction],
  );

  const updateFolderName = useCallback(
    async (folderId: Id<"folders">, name: string) => {
      await updateFolder({ folderId, name });
    },
    [updateFolder],
  );

  const moveNote = useCallback(
    async (noteId: Id<"notes">, folderId?: Id<"folders">) => {
      await moveNoteAction({ noteId, folderId });
    },
    [moveNoteAction],
  );

  const moveFolder = useCallback(
    async (folderId: Id<"folders">, parentId?: Id<"folders">) => {
      await moveFolderAction({ folderId, parentId });
    },
    [moveFolderAction],
  );

  const value: NotesContextType = {
    // State
    currentNoteId: currentEditor?.noteId ?? null,
    selectedNote,
    expandedFolders,
    sidebarData,

    // Actions
    selectNote,
    updateNoteContent,
    updateNoteTitle,
    toggleFolder,
    openFolder,
    createNote,
    createFolder,
    deleteNote,
    deleteFolder,
    updateFolderName,
    moveNote,
    moveFolder,
  };

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};
