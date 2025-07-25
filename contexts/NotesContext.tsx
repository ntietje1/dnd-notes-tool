"use client";

import {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useState,
  useMemo,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AnySidebarItem, Note, SidebarItemType } from "@/convex/notes/types";
import { redirect } from "next/navigation";
import { CustomBlock } from "@/app/campaigns/[dmUsername]/[campaignSlug]/notes/editor/extensions/tags/tags";
import { Campaign } from "@/convex/campaigns/types";

export type SortOrder = "alphabetical" | "dateCreated" | "dateModified";
export type SortDirection = "asc" | "desc";

export interface SortOptions {
  order: SortOrder;
  direction: SortDirection;
}

type NotesContextType = {
  // State
  currentCampaign: Campaign | null | undefined;
  currentNote: Note | null | undefined;
  expandedFolders: Set<Id<"folders">>;
  sidebarData: AnySidebarItem[] | undefined;
  isLoading: boolean;
  sortOptions: SortOptions;

  // Actions
  selectNote: (noteId: Id<"notes"> | null) => void;
  updateNoteContent: (content: CustomBlock[]) => Promise<void>;
  updateNoteName: (noteId: Id<"notes">, title: string) => Promise<void>;
  updateNoteTags: (noteId: Id<"notes">, tagIds: Id<"tags">[]) => Promise<void>;
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

  const currentCampaign = useQuery(api.campaigns.queries.getCampaignBySlug, {
    dmUsername: dmUsername,
    slug: campaignSlug,
  });

  // Queries that depend on campaignId
  const currentEditor = useQuery(api.editors.queries.getCurrentEditor, {
    campaignId: currentCampaign?._id,
  });

  const sidebarItems = useQuery(api.notes.queries.getSidebarData, {
    campaignId: currentCampaign?._id,
  });

  const currentNote = useQuery(api.notes.queries.getNote, {
    noteId: noteId,
  });

  // Get sort options from editor state
  const sortOptions: SortOptions = useMemo(
    () => ({
      order: currentEditor?.sortOrder ?? "dateCreated",
      direction: currentEditor?.sortDirection ?? "desc",
    }),
    [currentEditor?.sortOrder, currentEditor?.sortDirection],
  );

  // Compute sorted sidebar data
  const sidebarData = useMemo(() => {
    if (!sidebarItems) return undefined;
    return recursiveSortItemsByOptions(sidebarItems, sortOptions);
  }, [sidebarItems, sortOptions]);

  // Compute optimistic current note: use sidebarData if currentNote is undefined
  let optimisticCurrentNote = currentNote;
  if (optimisticCurrentNote === undefined && noteId && sidebarData) {
    const found =
      sidebarData && sidebarData.length > 0
        ? findItemInSidebar(noteId as Id<"notes">, sidebarData)
        : undefined;
    if (found && found.type === "notes") {
      optimisticCurrentNote = found as Note;
    }
  }

  const isLoading =
    currentCampaign === undefined ||
    currentEditor === undefined ||
    sidebarData === undefined ||
    (!!noteId && optimisticCurrentNote === undefined);

  const setCurrentEditor = useMutation(api.editors.mutations.setCurrentEditor);

  const updateNote = useMutation(
    api.notes.mutations.updateNote,
  ).withOptimisticUpdate((store, { noteId, content, name, tagIds }) => {
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
          ...(tagIds !== undefined && { tagIds }),
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
            ...(tagIds !== undefined && { tagIds }),
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

  const moveFolderAction = useMutation(
    api.notes.mutations.moveFolder,
  ).withOptimisticUpdate((store, { folderId, parentId }) => {
    const sidebarData = store.getQuery(api.notes.queries.getSidebarData, {
      campaignId: currentCampaign?._id,
    });
    if (!sidebarData) return;

    const updatedItems = sidebarData.map((item: AnySidebarItem) =>
      item._id === folderId && item.type === "folders"
        ? { ...item, parentFolderId: parentId }
        : item,
    );

    store.setQuery(
      api.notes.queries.getSidebarData,
      { campaignId: currentCampaign?._id },
      updatedItems,
    );
  });

  const moveNoteAction = useMutation(
    api.notes.mutations.moveNote,
  ).withOptimisticUpdate((store, { noteId, parentFolderId }) => {
    const sidebarData = store.getQuery(api.notes.queries.getSidebarData, {
      campaignId: currentCampaign?._id,
    });
    if (!sidebarData) return;

    const updatedItems = sidebarData.map((item: AnySidebarItem) =>
      item._id === noteId && item.type === "notes"
        ? { ...item, parentFolderId }
        : item,
    );

    store.setQuery(
      api.notes.queries.getSidebarData,
      { campaignId: currentCampaign?._id },
      updatedItems,
    );
  });

  const updateFolder = useMutation(
    api.notes.mutations.updateFolder,
  ).withOptimisticUpdate((store, { folderId, name }) => {
    const sidebarData = store.getQuery(api.notes.queries.getSidebarData, {
      campaignId: currentCampaign?._id,
    });
    if (!sidebarData) return;

    const updatedItems = sidebarData.map((item: AnySidebarItem) =>
      item._id === folderId && item.type === "folders"
        ? { ...item, name: name || "" }
        : item,
    );

    store.setQuery(
      api.notes.queries.getSidebarData,
      { campaignId: currentCampaign?._id },
      updatedItems,
    );
  });

  // Actions
  const selectNote = useCallback((noteId: Id<"notes"> | null) => {
    // Update the noteId query param in the URL without a full navigation (shallow routing)
    const url = new URL(window.location.href);
    if (noteId) {
      url.searchParams.set("noteId", noteId);
    } else {
      url.searchParams.delete("noteId");
    }
    window.history.pushState({}, "", url.toString());
  }, []);

  // Helper function to recursively sanitize content
  const sanitizeContent = (node: any): any => {
    if (!node) return null;

    // Handle arrays
    if (Array.isArray(node)) {
      return node.map(sanitizeContent).filter(Boolean);
    }

    // Handle objects
    if (typeof node === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(node)) {
        // Skip undefined values
        if (value === undefined) continue;
        // Recursively sanitize nested objects/arrays
        sanitized[key] = sanitizeContent(value);
      }
      return sanitized;
    }

    return node;
  };

  const updateNoteContent = useCallback(
    async (content: CustomBlock[]) => {
      // console.log("Updating note content:", content);
      // console.log("Current campaign:", currentCampaign);
      // console.log("current note id:", noteId);
      // console.log("Current note:", currentNote);
      // console.log("current optimistic note:", optimisticCurrentNote);
      // if (!currentNote || !currentNote._id) return;

      if (!noteId) return;

      // Sanitize the content before sending to Convex
      const sanitizedContent = sanitizeContent(content);
      await updateNote({
        noteId: noteId as Id<"notes">,
        content: sanitizedContent,
      });
    },
    [noteId, updateNote],
  );

  const updateNoteName = useCallback(
    async (noteId: Id<"notes">, name: string) => {
      await updateNote({ noteId, name });
    },
    [updateNote],
  );

  const updateNoteTags = useCallback(
    async (noteId: Id<"notes">, tagIds: Id<"tags">[]) => {
      await updateNote({ noteId, tagIds });
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
      if (!currentCampaign?._id) {
        throw new Error("Campaign ID is required");
      }
      const noteId = await createNoteAction({
        parentFolderId: folderId,
        campaignId: currentCampaign?._id,
      });
      selectNote(noteId);
    },
    [createNoteAction, currentCampaign],
  );

  const createFolder = useCallback(async () => {
    if (!currentCampaign?._id) {
      throw new Error("Campaign ID is required");
    }
    await createFolderAction({
      campaignId: currentCampaign?._id,
    });
  }, [createFolderAction, currentCampaign]);

  const deleteNote = useCallback(
    async (noteId: Id<"notes">) => {
      await deleteNoteAction({ noteId });
      if (currentNote?._id === noteId) {
        redirect(`/campaigns/${dmUsername}/${campaignSlug}/notes`);
      }
    },
    [deleteNoteAction, currentNote?._id, dmUsername, campaignSlug],
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
      if (!currentCampaign?._id) {
        throw new Error("Campaign ID is required");
      }
      setCurrentEditor({
        campaignId: currentCampaign?._id,
        sortOrder: options.order,
        sortDirection: options.direction,
      });
    },
    [setCurrentEditor],
  );

  if (currentCampaign === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentCampaign) {
    //TODO: show a toast
    redirect("/campaigns");
  }

  const value: NotesContextType = {
    // State
    currentCampaign: currentCampaign,
    currentNote: optimisticCurrentNote,
    expandedFolders,
    sidebarData,
    isLoading,
    sortOptions,

    // Actions
    selectNote,
    updateNoteContent,
    updateNoteName,
    updateNoteTags,
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
