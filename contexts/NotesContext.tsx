"use client";

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  AnySidebarItem,
  Note,
  FolderNode,
  SidebarItemType,
} from "@/convex/types";
import { Editor } from "@tiptap/core";

export type SortOrder = "alphabetical" | "dateCreated" | "dateModified";
export type SortDirection = "asc" | "desc";

export interface SortOptions {
  order: SortOrder;
  direction: SortDirection;
}

type NotesContextType = {
  // State
  currentNoteId: Id<"notes"> | null | undefined;
  selectedNote: Note | null | undefined;
  expandedFolders: Set<Id<"folders">>;
  sidebarData: AnySidebarItem[] | undefined;
  isLoading: boolean;
  sortOptions: SortOptions;

  // Actions
  selectNote: (noteId: Id<"notes">) => void;
  updateNoteContent: (editor: Editor) => Promise<void>;
  updateNoteName: (noteId: Id<"notes">, title: string) => Promise<void>;
  toggleFolder: (folderId: Id<"folders">) => void;
  openFolder: (folderId: Id<"folders">) => void;
  createNote: (folderId?: Id<"folders">) => Promise<void>;
  createFolder: () => Promise<void>;
  deleteNote: (noteId: Id<"notes">) => Promise<void>;
  deleteFolder: (folderId: Id<"folders">) => Promise<void>;
  moveNote: (
    noteId: Id<"notes">,
    parentFolderId?: Id<"folders">,
  ) => Promise<void>;
  moveFolder: (
    folderId: Id<"folders">,
    parentId?: Id<"folders">,
  ) => Promise<void>;
  updateFolderName: (folderId: Id<"folders">, name: string) => Promise<void>;
  setSortOptions: (options: SortOptions) => void;
};

const NotesContext = createContext<NotesContextType | null>(null);

const findItemInSidebar = (
  targetId: Id<SidebarItemType>,
  items: AnySidebarItem[],
): AnySidebarItem | undefined => {
  for (const item of items) {
    if (item.type === "notes" && item._id === targetId) {
      return item;
    }
    if (item.type === "folders" && item.children.length > 0) {
      const found = findItemInSidebar(targetId, item.children);
      if (found) return found;
    }
  }
  return undefined;
};

function recursiveSortItemsByOptions(
  items: AnySidebarItem[],
  options: SortOptions,
): AnySidebarItem[] {
  const { order, direction } = options;

  return [...items]
    .sort((a, b) => {
      switch (order) {
        case "alphabetical":
          const nameA = a.name || "";
          const nameB = b.name || "";
          return direction === "asc"
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        case "dateCreated":
          return direction === "asc"
            ? a._creationTime - b._creationTime
            : b._creationTime - a._creationTime;
        case "dateModified":
          return direction === "asc"
            ? a.updatedAt - b.updatedAt
            : b.updatedAt - a.updatedAt;
        default:
          return 0;
      }
    })
    .map((item) => {
      if (item.type === "folders") {
        return {
          ...item,
          children: recursiveSortItemsByOptions(item.children, options),
        };
      }
      return item;
    });
}

export function NotesProvider({ children }: { children: ReactNode }) {
  // Local state
  const [expandedFolders, setExpandedFolders] = useState<Set<Id<"folders">>>(
    new Set(),
  );

  // Queries
  const currentEditor = useQuery(api.notes.getCurrentEditor);
  const selectedNote = useQuery(api.notes.getNote, {
    noteId: currentEditor?.activeNoteId,
  });
  const sidebarItems = useQuery(api.notes.getSidebarData);

  // Get sort options from editor state
  const sortOptions: SortOptions = useMemo(
    () => ({
      order: currentEditor?.sortOrder ?? "alphabetical",
      direction: currentEditor?.sortDirection ?? "asc",
    }),
    [currentEditor?.sortOrder, currentEditor?.sortDirection],
  );

  // Compute sorted sidebar data
  const sidebarData = useMemo(() => {
    if (!sidebarItems) return undefined;
    return recursiveSortItemsByOptions(sidebarItems, sortOptions);
  }, [sidebarItems, sortOptions]);

  // Loading state - true until all initial data is loaded
  const isLoading = currentEditor === undefined || sidebarData === undefined;

  // Mutations
  const setCurrentEditor = useMutation(
    api.notes.setCurrentEditor,
  ).withOptimisticUpdate((store, { noteId, sortOrder, sortDirection }) => {
    // Optimistically update the getCurrentEditor query
    const currentEditor = store.getQuery(api.notes.getCurrentEditor, {});
    if (currentEditor) {
      store.setQuery(
        api.notes.getCurrentEditor,
        {},
        {
          ...currentEditor,
          ...(noteId !== undefined && { activeNoteId: noteId }),
          ...(sortOrder !== undefined && { sortOrder }),
          ...(sortDirection !== undefined && { sortDirection }),
        },
      );
    }

    // Optimistically update the getNote query for the new note
    if (noteId) {
      // Try to get the note from the existing getNote query
      const existingNote = store.getQuery(api.notes.getNote, { noteId });
      if (existingNote) {
        store.setQuery(api.notes.getNote, { noteId }, existingNote);
        return;
      }

      // If note not in getNote query, try to find it in the sidebar data
      const sidebarData = store.getQuery(api.notes.getSidebarData, {});
      if (sidebarData) {
        const foundNote = findItemInSidebar(noteId, sidebarData) as Note;
        if (foundNote) {
          store.setQuery(api.notes.getNote, { noteId }, foundNote);
        }
      }
    }
  });
  const updateNote = useMutation(api.notes.updateNote).withOptimisticUpdate(
    (store, { noteId, content, name }) => {
      // Optimistically update the getNote query
      const note = store.getQuery(api.notes.getNote, { noteId });
      if (note) {
        store.setQuery(
          api.notes.getNote,
          { noteId },
          {
            ...note,
            ...(content !== undefined && { content }),
            ...(name !== undefined && { name }),
          },
        );
      }

      // Optimistically update the note in the sidebar data
      const sidebarData = store.getQuery(api.notes.getSidebarData, {});
      if (!sidebarData) return;

      const updatedItems = sidebarData.map((item) =>
        item._id === noteId && item.type === "notes"
          ? {
              ...item,
              ...(content !== undefined && { content }),
              ...(name !== undefined && { name }),
            }
          : item,
      );

      store.setQuery(api.notes.getSidebarData, {}, updatedItems);
    },
  );
  const createNoteAction = useMutation(api.notes.createNote);
  const createFolderAction = useMutation(api.notes.createFolder);
  const deleteNoteAction = useMutation(api.notes.deleteNote);
  const deleteFolderAction = useMutation(api.notes.deleteFolder);
  const moveFolderAction = useMutation(
    api.notes.moveFolder,
  ).withOptimisticUpdate((store, { folderId, parentId }) => {
    const sidebarData = store.getQuery(api.notes.getSidebarData, {});
    if (!sidebarData) return;

    const updatedItems = sidebarData.map((item) =>
      item._id === folderId && item.type === "folders"
        ? { ...item, parentFolderId: parentId }
        : item,
    );

    store.setQuery(api.notes.getSidebarData, {}, updatedItems);
  });

  const moveNoteAction = useMutation(api.notes.moveNote).withOptimisticUpdate(
    (store, { noteId, parentFolderId }) => {
      const sidebarData = store.getQuery(api.notes.getSidebarData, {});
      if (!sidebarData) return;

      const updatedItems = sidebarData.map((item) =>
        item._id === noteId && item.type === "notes"
          ? { ...item, parentFolderId }
          : item,
      );

      store.setQuery(api.notes.getSidebarData, {}, updatedItems);
    },
  );
  const updateFolder = useMutation(api.notes.updateFolder).withOptimisticUpdate(
    (store, { folderId, name }) => {
      const sidebarData = store.getQuery(api.notes.getSidebarData, {});
      if (!sidebarData) return;

      const updatedItems = sidebarData.map((item) =>
        item._id === folderId && item.type === "folders"
          ? { ...item, name: name || "" }
          : item,
      );

      store.setQuery(api.notes.getSidebarData, {}, updatedItems);
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

  const updateNoteName = useCallback(
    async (noteId: Id<"notes">, name: string) => {
      await updateNote({ noteId, name });
    },
    [updateNote],
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

  const createNote = useCallback(
    async (folderId?: Id<"folders">) => {
      await createNoteAction({ parentFolderId: folderId });
    },
    [createNoteAction],
  );

  const createFolder = useCallback(async () => {
    await createFolderAction({});
  }, [createFolderAction]);

  const deleteNote = useCallback(
    async (noteId: Id<"notes">) => {
      await deleteNoteAction({ noteId });
      if (currentEditor?.activeNoteId === noteId) {
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
    async (noteId: Id<"notes">, parentFolderId?: Id<"folders">) => {
      await moveNoteAction({ noteId, parentFolderId });
    },
    [moveNoteAction],
  );

  const moveFolder = useCallback(
    async (folderId: Id<"folders">, parentId?: Id<"folders">) => {
      await moveFolderAction({ folderId, parentId });
    },
    [moveFolderAction],
  );

  const setSortOptions = useCallback(
    (options: SortOptions) => {
      setCurrentEditor({
        sortOrder: options.order,
        sortDirection: options.direction,
      });
    },
    [setCurrentEditor],
  );

  const value: NotesContextType = {
    // State
    currentNoteId: currentEditor?.activeNoteId ?? null,
    selectedNote,
    expandedFolders,
    sidebarData,
    isLoading,
    sortOptions,

    // Actions
    selectNote,
    updateNoteContent,
    updateNoteName,
    toggleFolder,
    openFolder,
    createNote,
    createFolder,
    deleteNote,
    deleteFolder,
    updateFolderName,
    moveNote,
    moveFolder,
    setSortOptions,
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
