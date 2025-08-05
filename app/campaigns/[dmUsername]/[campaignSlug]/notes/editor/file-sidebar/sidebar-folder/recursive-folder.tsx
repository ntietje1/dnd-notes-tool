"use client";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DroppableFolder } from "./droppable-folder";
import { FolderButton } from "./folder-button";
import { FolderNode } from "@/convex/notes/types";
import { Id } from "@/convex/_generated/dataModel";
import { SidebarItem } from "../sidebar-item/sidebar-item";
import { useNotes } from "@/contexts/NotesContext";

interface RecursiveFolderProps {
  folder: FolderNode;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
  expandedFolders: Set<Id<"folders">>;
  toggleFolder: (folderId: Id<"folders">) => void;
  updateFolderName: (folderId: Id<"folders">, name: string) => void;
  deleteFolder: (folderId: Id<"folders">) => void;
  createNote: (folderId: Id<"folders">) => void;
}

export function RecursiveFolder({
  folder,
  renamingId,
  setRenamingId,
  expandedFolders,
  toggleFolder,
  updateFolderName,
  deleteFolder,
  createNote,
}: RecursiveFolderProps) {
  const isExpanded = expandedFolders.has(folder._id);
  const isRenaming = renamingId === folder._id;
  const hasItems = folder.children.length > 0;

  return (
    <DroppableFolder folder={folder}>
      <Collapsible
        open={isExpanded}
        onOpenChange={() => toggleFolder(folder._id)}
      >
        <FolderButton
          folder={folder}
          isExpanded={isExpanded}
          isRenaming={isRenaming}
          hasItems={hasItems}
          onToggleExpanded={() => toggleFolder(folder._id)}
          onStartRename={() => setRenamingId(folder._id)}
          onFinishRename={(name) => {
            updateFolderName(folder._id, name);
            setRenamingId(null);
          }}
          onDelete={() => deleteFolder(folder._id)}
          onNewPage={() => {
            if (!isExpanded) {
              toggleFolder(folder._id);
            }
            createNote(folder._id);
          }}
        />
        <CollapsibleContent>
          <div className="relative pl-4">
            {/* Vertical line */}
            {hasItems && (
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-muted-foreground/10" />
            )}
            {folder.children.map((item) => (
              <SidebarItem
                key={item._id}
                item={item}
                renamingId={renamingId}
                setRenamingId={setRenamingId}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </DroppableFolder>
  );
}
