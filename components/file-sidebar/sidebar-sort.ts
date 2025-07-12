import { FolderNode, Note, UNTITLED_NOTE_TITLE } from "@/convex/types";

export type SortOrder = "alphabetical" | "dateCreated" | "dateModified";
export type SortDirection = "asc" | "desc";

export interface SortOptions {
  order: SortOrder;
  direction: SortDirection;
}

function getItemName(item: { name?: string; title?: string }): string {
  if ("name" in item && item.name) return item.name;
  if ("title" in item && item.title) return item.title;
  return UNTITLED_NOTE_TITLE;
}

export function sortItems<T extends { name?: string; title?: string }>(
  items: T[],
  options: SortOptions,
): T[] {
  const { order, direction } = options;

  const sortedItems = [...items].sort((a, b) => {
    switch (order) {
      case "alphabetical":
        const nameA = getItemName(a);
        const nameB = getItemName(b);
        return direction === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      // Add more cases here for other sort types
      default:
        return 0;
    }
  });

  return sortedItems;
}

type SidebarItem = FolderNode | Note;

export function sortFoldersAndNotes(
  folders: FolderNode[],
  notes: Note[],
  options: SortOptions,
): { sortedItems: SidebarItem[] } {
  // Sort folders recursively (internal structure)
  const processedFolders = folders.map((folder) => {
    // First sort the child folders and notes recursively
    const sortedChildFolders = sortFoldersAndNotes(
      folder.childFolders,
      [],
      options,
    ).sortedItems as FolderNode[];
    const sortedChildNotes = sortItems(folder.childNotes, options);

    // Return a new folder with sorted children
    return {
      ...folder,
      childFolders: sortedChildFolders,
      childNotes: sortedChildNotes,
    };
  });

  // Sort the processed folders at this level
  const sortedFolders = sortItems(processedFolders, options);

  // Sort the notes at this level
  const sortedNotes = sortItems(notes, options);

  // Combine folders and notes into a single array
  const sortedItems: SidebarItem[] = [...sortedFolders, ...sortedNotes];

  return { sortedItems };
}
