import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
  useState,
  useMemo,
  useEffect,
} from "react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import {
  type AnySidebarItem,
  type NoteWithContent,
  type SidebarItemType,
  type Note,
  type FolderNode,
  SIDEBAR_ITEM_TYPES,
} from "convex/notes/types";
import { type CustomBlock } from "convex/notes/editorSpecs";
import { debounce } from "lodash-es";
import { SORT_DIRECTIONS, SORT_ORDERS, type SortOptions } from "convex/editors/types";
import { useCampaign } from "./CampaignContext";
import { useMutation, useQuery, type QueryStatus } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { combineStatus } from "~/utils/combineStatus";

type NotesContextType = {
  noteId: string | null;
  note: NoteWithContent | null | undefined;
  expandedFolders: Set<Id<"folders">>;
  sidebarData: AnySidebarItem[] | undefined;
  status: QueryStatus;
  sortOptions: SortOptions;

  selectNote: (noteId: Id<"notes"> | null) => void;
  updateNoteContent: (content: CustomBlock[]) => Promise<void>;
  debouncedUpdateNoteContent: (content: CustomBlock[]) => void;
  updateNoteName: (noteId: Id<"notes">, title: string) => Promise<void>;
  toggleFolder: (folderId: Id<"folders">) => void;
  openFolder: (folderId: Id<"folders">) => void;
  createNote: (folderId?: Id<"folders">) => Promise<Id<"notes"> | undefined>;
  createFolder: (parentFolderId?: Id<"folders">) => Promise<Id<"folders"> | undefined>;
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
        case SORT_ORDERS.Alphabetical:
          const nameA = a.name || "";
          const nameB = b.name || "";
          return direction === SORT_DIRECTIONS.Ascending
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        case SORT_ORDERS.DateCreated:
          return direction === SORT_DIRECTIONS.Ascending
            ? a._creationTime - b._creationTime
            : b._creationTime - a._creationTime;
        case SORT_ORDERS.DateModified:
          return direction === SORT_DIRECTIONS.Ascending
            ? a.updatedAt - b.updatedAt
            : b.updatedAt - a.updatedAt;
        default:
          return 0;
      }
    })
    .map((item) => {
      if (item.type === SIDEBAR_ITEM_TYPES.folders && item.children.length > 0) {
        return {
          ...item,
          children: recursiveSortItemsByOptions(item.children, options),
        };
      }
      return item;
    });
}

interface NotesProviderProps {
  children: ReactNode;
}

export function NotesProvider({ children }: NotesProviderProps) {
  const { dmUsername, campaignSlug, campaignWithMembership } = useCampaign();
  const campaign = campaignWithMembership?.data?.campaign;
  const location = useLocation();
  const routeNoteId = location.pathname.includes('/notes/') && !location.pathname.endsWith('/notes')
    ? location.pathname.split('/notes/')[1]
    : null;

  const [expandedFolders, setExpandedFolders] = useState<Set<Id<"folders">>>(
    new Set(),
  );
  const navigate = useNavigate();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(routeNoteId);
  
  const campaignLoaded = campaignWithMembership?.status === "success" && campaign?._id !== undefined;

  const editor = useQuery(convexQuery(
    api.editors.queries.getCurrentEditor,
    campaignLoaded ? { campaignId: campaign._id } : "skip",
  ));

  const sidebarItems = useQuery(convexQuery(
    api.notes.queries.getSidebarData,
    campaignLoaded ? { campaignId: campaign._id } : "skip",
  ));

  const note = useQuery(convexQuery(
    api.notes.queries.getNote,
    (campaignLoaded && selectedNoteId) ? { noteId: selectedNoteId as Id<"notes"> } : "skip",
  ));

  const sortOptions: SortOptions = useMemo(
    () => ({
      order: editor?.data?.sortOrder ?? SORT_ORDERS.DateCreated,
      direction: editor?.data?.sortDirection ?? SORT_DIRECTIONS.Descending,
      foldersAlwaysOnTop: editor?.data?.foldersAlwaysOnTop ?? false,
    }),
    [
      editor?.data?.sortOrder,
      editor?.data?.sortDirection,
      editor?.data?.foldersAlwaysOnTop,
    ],
  );

  const sidebarData = useMemo(() => {
    if (!sidebarItems.data) return undefined;
    return recursiveSortItemsByOptions(sidebarItems.data, sortOptions);
  }, [sidebarItems.data, sortOptions]);

  const status = combineStatus([campaignWithMembership?.status, editor.status, sidebarItems.status, ...(selectedNoteId ? [note.status] : [])]);

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

  const setCurrentEditor = useMutation({
    mutationFn: useConvexMutation(api.editors.mutations.setCurrentEditor),
  });

  const updateNote = useMutation({
    mutationFn: useConvexMutation(api.notes.mutations.updateNote),
  });

  const createNoteAction = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.createNote) });
  const createFolderAction = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.createFolder) });
  const deleteNoteAction = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.deleteNote) });
  const deleteFolderAction = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.deleteFolder) });
  const moveNoteAction = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.moveNote) });
  const moveFolderAction = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.moveFolder) });
  const updateFolderAction = useMutation({ mutationFn: useConvexMutation(api.notes.mutations.updateFolder) });

  const selectNote = useCallback((noteId: Id<"notes"> | null) => {
    setSelectedNoteId(noteId ?? null);
    if (!noteId) {
      navigate({
        to: '/campaigns/$dmUsername/$campaignSlug/notes',
        params: { dmUsername, campaignSlug }
      });
      return;
    }

    navigate({
      to: '/campaigns/$dmUsername/$campaignSlug/notes/$noteId',
      params: { dmUsername, campaignSlug, noteId }
    });
  }, [dmUsername, campaignSlug, navigate]);

  const updateNoteContent = useCallback(
    async (content: CustomBlock[]) => {
      if (!note.data?._id) return;

      const sanitizedContent = sanitizeContent(content);
      await updateNote.mutateAsync({
        noteId: note.data._id,
        content: sanitizedContent,
      });
    },
    [note.data?._id, updateNote],
  );

  const updateNoteName = useCallback(
    async (noteId: Id<"notes">, title: string) => {
      await updateNote.mutateAsync({
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
      if (!campaign?._id) return;

      const noteId = await createNoteAction.mutateAsync({
        campaignId: campaign._id,
        parentFolderId: folderId,
      });

      if (noteId) {
        selectNote(noteId);
        if (folderId) {
          openFolder(folderId);
        }
      }

      return noteId;
    },
    [campaign?._id, createNoteAction, selectNote, openFolder],
  );

  const createFolder = useCallback(async (parentFolderId?: Id<"folders">) => {
    if (!campaign?._id) return;

    const folderId = await createFolderAction.mutateAsync({
      campaignId: campaign._id,
      parentFolderId,
    });

    if (folderId) {
      openFolder(folderId);
    }

    return folderId;
  }, [campaign?._id, createFolderAction, openFolder]);

  const deleteNote = useCallback(
    async (noteId: Id<"notes">) => {
      await deleteNoteAction.mutateAsync({ noteId });
      if (note.data?._id === noteId) {
        selectNote(null);
      }
    },
    [deleteNoteAction, note.data?._id, selectNote],
  );

  const deleteFolder = useCallback(
    async (folderId: Id<"folders">) => {
      await deleteFolderAction.mutateAsync({ folderId });
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
      await moveNoteAction.mutateAsync({
        noteId,
        parentFolderId,
      });
    },
    [moveNoteAction],
  );

  const moveFolder = useCallback(
    async (folderId: Id<"folders">, parentId?: Id<"folders">) => {
      await moveFolderAction.mutateAsync({
        folderId,
        parentId,
      });
    },
    [moveFolderAction],
  );

  const updateFolderName = useCallback(
    async (folderId: Id<"folders">, name: string) => {
      await updateFolderAction.mutateAsync({
        folderId,
        name,
      });
    },
    [updateFolderAction],
  );

  const setSortOptions = useCallback(
    async (options: SortOptions) => {
      if (!campaign?._id) return;

      await setCurrentEditor.mutateAsync({
        campaignId: campaign._id,
        sortOrder: options.order,
        sortDirection: options.direction,
        foldersAlwaysOnTop: options.foldersAlwaysOnTop,
      });
    },
    [campaign?._id, setCurrentEditor],
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

  useEffect(() => {
    setSelectedNoteId(routeNoteId);
  }, [routeNoteId]);

  const value: NotesContextType = {
    // State
    noteId: selectedNoteId,
    note: note.data,
    expandedFolders,
    sidebarData,
    status,
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
