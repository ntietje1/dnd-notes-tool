"use client";

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useState,
  useMemo,
  useEffect,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  AnySidebarItem,
  NoteWithContent,
  SidebarItemType,
  Note,
  FolderNode,
} from "@/convex/notes/types";
import { CustomBlock } from "@/app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";
import { Campaign } from "@/convex/campaigns/types";
import { debounce } from "lodash-es";

export type SortOrder = "alphabetical" | "dateCreated" | "dateModified";
export type SortDirection = "asc" | "desc";

export interface SortOptions {
  order: SortOrder;
  direction: SortDirection;
  foldersAlwaysOnTop: boolean;
}

type NotesContextType = {
  // State
  currentCampaign: Campaign | null | undefined;
  currentNote: NoteWithContent | null | undefined;
  expandedFolders: Set<Id<"folders">>;
  sidebarData: AnySidebarItem[] | undefined;
  isLoading: boolean;
  isInitialLoading: boolean;
  sortOptions: SortOptions;

  // Actions
  selectNote: (noteId: Id<"notes"> | null) => void;
  updateNoteContent: (content: CustomBlock[]) => Promise<void>;
  debouncedUpdateNoteContent: (content: CustomBlock[]) => void;
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
  setSortOptions: (options: SortOptions) => Promise<void>;

  // Drag & Drop helpers
  findNoteRecursively: (noteId: Id<"notes">) => Note | undefined;
  findFolderRecursively: (folderId: Id<"folders">) => FolderNode | undefined;
  isFolderDescendant: (
    parentFolderId: Id<"folders">,
    targetFolderId: Id<"folders">,
  ) => boolean;
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
      if (
        options.foldersAlwaysOnTop &&
        a.type === "folders" &&
        b.type !== "folders"
      ) {
        return -1;
      }
      if (
        options.foldersAlwaysOnTop &&
        a.type !== "folders" &&
        b.type === "folders"
      ) {
        return 1;
      }
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
      if (item.type === "folders" && item.children.length > 0) {
        return {
          ...item,
          children: recursiveSortItemsByOptions(item.children, options),
        };
      }
      return item;
    });
}

interface NotesProviderProps {
  dmUsername: string;
  campaignSlug: string;
  noteId?: string;
  children: ReactNode;
}

export function NotesProvider({
  dmUsername,
  campaignSlug,
  noteId,
  children,
}: NotesProviderProps) {
  // Local state
  const [expandedFolders, setExpandedFolders] = useState<Set<Id<"folders">>>(
    new Set(),
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Preload campaign data with priority
  const currentCampaign = useQuery(api.campaigns.queries.getCampaignBySlug, {
    dmUsername: dmUsername,
    slug: campaignSlug,
  });

  // Queries that depend on campaignId - use conditional queries to avoid unnecessary calls
  const currentEditor = useQuery(
    api.editors.queries.getCurrentEditor,
    currentCampaign?._id ? { campaignId: currentCampaign._id } : "skip",
  );

  const sidebarItems = useQuery(
    api.notes.queries.getSidebarData,
    currentCampaign?._id ? { campaignId: currentCampaign._id } : "skip",
  );

  // Preload current note if specified
  const currentNote = useQuery(
    api.notes.queries.getNote,
    noteId ? { noteId: noteId } : "skip",
  );

  // Get sort options from editor state
  const sortOptions: SortOptions = useMemo(
    () => ({
      order: currentEditor?.sortOrder ?? "dateCreated",
      direction: currentEditor?.sortDirection ?? "desc",
      foldersAlwaysOnTop: currentEditor?.foldersAlwaysOnTop ?? false,
    }),
    [
      currentEditor?.sortOrder,
      currentEditor?.sortDirection,
      currentEditor?.foldersAlwaysOnTop,
    ],
  );

  // Compute sorted sidebar data
  const sidebarData = useMemo(() => {
    if (!sidebarItems) return undefined;
    return recursiveSortItemsByOptions(sidebarItems, sortOptions);
  }, [sidebarItems, sortOptions]);

  // Track initial loading state
  useEffect(() => {
    if (currentCampaign !== undefined && sidebarData !== undefined) {
      setIsInitialLoad(false);
    }
  }, [currentCampaign, sidebarData]);

  // More granular loading states
  const isCampaignLoading = currentCampaign === undefined;
  const isEditorLoading = currentCampaign?._id && currentEditor === undefined;
  const isSidebarLoading = currentCampaign?._id && sidebarData === undefined;
  const isNoteLoading = !!noteId && currentNote === undefined;

  const isLoading =
    isCampaignLoading || isEditorLoading || isSidebarLoading || isNoteLoading;

  const isInitialLoading = isInitialLoad && isLoading;

  // Drag & Drop helper functions
  const findNoteRecursively = useCallback(
    (noteId: Id<"notes">): Note | undefined => {
      if (!sidebarData) return undefined;

      const findInItems = (items: AnySidebarItem[]): Note | undefined => {
        for (const item of items) {
          if (item.type === "notes" && item._id === noteId) {
            return item;
          }
          if (item.type === "folders") {
            const found = findInItems(item.children);
            if (found) return found;
          }
        }
        return undefined;
      };

      return findInItems(sidebarData);
    },
    [sidebarData],
  );

  const findFolderRecursively = useCallback(
    (folderId: Id<"folders">): FolderNode | undefined => {
      if (!sidebarData) return undefined;

      const findInItems = (items: AnySidebarItem[]): FolderNode | undefined => {
        for (const item of items) {
          if (item.type === "folders") {
            if (item._id === folderId) return item;
            const found = findInItems(item.children);
            if (found) return found;
          }
        }
        return undefined;
      };

      return findInItems(sidebarData);
    },
    [sidebarData],
  );

  const isFolderDescendant = useCallback(
    (parentFolderId: Id<"folders">, targetFolderId: Id<"folders">): boolean => {
      if (!sidebarData) return false;

      const findInItems = (items: AnySidebarItem[]): boolean => {
        for (const item of items) {
          if (item.type === "folders" && item._id === parentFolderId) {
            // Check if targetFolderId is in this folder's children
            const checkChildren = (children: AnySidebarItem[]): boolean => {
              for (const child of children) {
                if (child.type === "folders") {
                  if (child._id === targetFolderId) {
                    return true;
                  }
                  if (checkChildren(child.children)) {
                    return true;
                  }
                }
              }
              return false;
            };
            return checkChildren(item.children);
          }
          if (item.type === "folders") {
            if (findInItems(item.children)) {
              return true;
            }
          }
        }
        return false;
      };

      return findInItems(sidebarData);
    },
    [sidebarData],
  );

  const setCurrentEditor = useMutation(api.editors.mutations.setCurrentEditor);

  const updateNote = useMutation(
    api.notes.mutations.updateNote,
  ).withOptimisticUpdate((store, { noteId, content, name }) => {
    // Optimistically update the getNote query
    const note = store.getQuery(api.notes.queries.getNote, { noteId });
    if (note) {
      store.setQuery(
        api.notes.queries.getNote,
        { noteId },
        {
          ...note,
          ...(content !== undefined && { content }),
          ...(name !== undefined && { name }),
        },
      );
    }

    // Optimistically update the note in the sidebar data
    const sidebarData = store.getQuery(api.notes.queries.getSidebarData, {
      campaignId: currentCampaign?._id,
    });
    if (!sidebarData) return;

    const updatedItems = sidebarData.map((item: AnySidebarItem) =>
      item._id === noteId && item.type === "notes"
        ? {
            ...item,
            ...(content !== undefined && { content }),
            ...(name !== undefined && { name }),
          }
        : item,
    );

    store.setQuery(
      api.notes.queries.getSidebarData,
      { campaignId: currentCampaign?._id },
      updatedItems,
    );
  });

  const createNoteAction = useMutation(api.notes.mutations.createNote);
  const createFolderAction = useMutation(api.notes.mutations.createFolder);
  const deleteNoteAction = useMutation(api.notes.mutations.deleteNote);
  const deleteFolderAction = useMutation(api.notes.mutations.deleteFolder);
  const moveNoteAction = useMutation(api.notes.mutations.moveNote);
  const moveFolderAction = useMutation(api.notes.mutations.moveFolder);
  const updateFolderAction = useMutation(api.notes.mutations.updateFolder);

  const selectNote = useCallback((noteId: Id<"notes"> | null) => {
    if (!noteId) {
      // Clear the note selection
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Update the URL to include the note ID
    const url = new URL(window.location.href);
    url.searchParams.set("noteId", noteId);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const updateNoteContent = useCallback(
    async (content: CustomBlock[]) => {
      if (!currentNote?._id) return;

      const sanitizedContent = sanitizeContent(content);
      await updateNote({
        noteId: currentNote._id,
        content: sanitizedContent,
      });
    },
    [currentNote?._id, updateNote],
  );

  const updateNoteName = useCallback(
    async (noteId: Id<"notes">, title: string) => {
      await updateNote({
        noteId,
        name: title,
      });
    },
    [updateNote],
  );

  const toggleFolder = useCallback((folderId: Id<"folders">) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  const openFolder = useCallback((folderId: Id<"folders">) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      newSet.add(folderId);
      return newSet;
    });
  }, []);

  const createNote = useCallback(
    async (folderId?: Id<"folders">) => {
      if (!currentCampaign?._id) return;

      const noteId = await createNoteAction({
        campaignId: currentCampaign._id,
        parentFolderId: folderId,
      });

      if (noteId) {
        selectNote(noteId);
        if (folderId) {
          openFolder(folderId);
        }
      }
    },
    [currentCampaign?._id, createNoteAction, selectNote, openFolder],
  );

  const createFolder = useCallback(async () => {
    if (!currentCampaign?._id) return;

    const folderId = await createFolderAction({
      campaignId: currentCampaign._id,
    });

    if (folderId) {
      openFolder(folderId);
    }
  }, [currentCampaign?._id, createFolderAction, openFolder]);

  const deleteNote = useCallback(
    async (noteId: Id<"notes">) => {
      await deleteNoteAction({ noteId });
      if (currentNote?._id === noteId) {
        selectNote(null);
      }
    },
    [deleteNoteAction, currentNote?._id, selectNote],
  );

  const deleteFolder = useCallback(
    async (folderId: Id<"folders">) => {
      await deleteFolderAction({ folderId });
      setExpandedFolders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(folderId);
        return newSet;
      });
    },
    [deleteFolderAction],
  );

  const moveNote = useCallback(
    async (noteId: Id<"notes">, parentFolderId?: Id<"folders">) => {
      await moveNoteAction({
        noteId,
        parentFolderId,
      });
    },
    [moveNoteAction],
  );

  const moveFolder = useCallback(
    async (folderId: Id<"folders">, parentId?: Id<"folders">) => {
      await moveFolderAction({
        folderId,
        parentId,
      });
    },
    [moveFolderAction],
  );

  const updateFolderName = useCallback(
    async (folderId: Id<"folders">, name: string) => {
      await updateFolderAction({
        folderId,
        name,
      });
    },
    [updateFolderAction],
  );

  const setSortOptions = useCallback(
    async (options: SortOptions) => {
      if (!currentCampaign?._id) return;

      await setCurrentEditor({
        campaignId: currentCampaign._id,
        sortOrder: options.order,
        sortDirection: options.direction,
        foldersAlwaysOnTop: options.foldersAlwaysOnTop,
      });
    },
    [currentCampaign?._id, setCurrentEditor],
  );

  const sanitizeContent = (node: any): any => {
    if (typeof node === "string") {
      return node;
    }
    if (Array.isArray(node)) {
      return node.map(sanitizeContent);
    }
    if (node && typeof node === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(node)) {
        if (key !== "_id" && key !== "__typename") {
          sanitized[key] = sanitizeContent(value);
        }
      }
      return sanitized;
    }
    return node;
  };

  const debouncedUpdateNoteContent = useMemo(
    () => debounce(updateNoteContent, 2000),
    [updateNoteContent],
  );

  useEffect(() => {
    return () => {
      debouncedUpdateNoteContent.cancel();
    };
  }, [debouncedUpdateNoteContent]);

  const value: NotesContextType = {
    // State
    currentCampaign,
    currentNote,
    expandedFolders,
    sidebarData,
    isLoading,
    isInitialLoading,
    sortOptions,

    // Actions
    selectNote,
    updateNoteContent,
    debouncedUpdateNoteContent,
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

    // Drag & Drop helpers
    findNoteRecursively,
    findFolderRecursively,
    isFolderDescendant,
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
