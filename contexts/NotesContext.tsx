"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
  useState,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type NotesContextType = {
  // State
  currentNoteId: Id<"notes"> | null;
  selectedNote: any | null; // We'll type this properly later
  expandedFolders: Set<Id<"folders">>;
  sidebarData: any | null; // We'll type this properly later

  // Actions
  selectNote: (noteId: Id<"notes">) => void;
  updateNoteContent: (content: any) => Promise<void>;
  updateNoteTitle: (title: string) => Promise<void>;
  toggleFolder: (folderId: Id<"folders">) => void;
  openFolder: (folderId: Id<"folders">) => void;
  createNote: () => Promise<void>;
  createFolder: () => Promise<void>;
  deleteNote: (noteId: Id<"notes">) => Promise<void>;
  deleteFolder: (folderId: Id<"folders">) => Promise<void>;
  moveNote: (noteId: Id<"notes">, folderId?: Id<"folders">) => Promise<void>;
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
  const moveNoteAction = useMutation(api.notes.moveNote);
  const updateFolder = useMutation(api.notes.updateFolder);

  // Actions
  const selectNote = useCallback(
    (noteId: Id<"notes">) => {
      setCurrentEditor({ noteId });
    },
    [setCurrentEditor],
  );

  const updateNoteContent = useCallback(
    async (content: any) => {
      if (!selectedNote?._id) return;
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
