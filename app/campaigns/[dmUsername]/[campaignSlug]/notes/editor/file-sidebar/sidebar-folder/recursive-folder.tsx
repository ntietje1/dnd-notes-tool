"use client";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DroppableFolder } from "./droppable-folder";
import { FolderButton } from "./folder-button";
import { FolderNode } from "@/convex/notes/types";
import { Id } from "@/convex/_generated/dataModel";
import { SidebarItem } from "../sidebar-item/sidebar-item";

interface RecursiveFolderProps {
  folder: FolderNode;
  expandedFolders: Set<Id<"folders">>;
  renamingId: Id<"folders"> | Id<"notes"> | null;
  selectedNoteId: Id<"notes"> | null;
  toggleFolder: (folderId: Id<"folders">) => void;
  setRenamingId: (id: Id<"folders"> | Id<"notes"> | null) => void;
  handleFinishFolderRename: (id: Id<"folders">, name: string) => void;
  handleFinishNoteRename: (id: Id<"notes">, name: string) => void;
  deleteFolder: (id: Id<"folders">) => void;
  deleteNote: (id: Id<"notes">) => void;
  selectNote: (id: Id<"notes">) => void;
  createNote: (id: Id<"folders">) => void;
}

export function RecursiveFolder({
  folder,
  expandedFolders,
  renamingId,
  selectedNoteId,
  toggleFolder,
  setRenamingId,
  handleFinishFolderRename,
  handleFinishNoteRename,
  deleteFolder,
  deleteNote,
  selectNote,
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
          onToggle={() => toggleFolder(folder._id)}
          onStartRename={() => setRenamingId(folder._id)}
          onFinishRename={(name) => handleFinishFolderRename(folder._id, name)}
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
                expandedFolders={expandedFolders}
                renamingId={renamingId}
                selectedNoteId={selectedNoteId}
                toggleFolder={toggleFolder}
                setRenamingId={setRenamingId}
                handleFinishFolderRename={handleFinishFolderRename}
                handleFinishNoteRename={handleFinishNoteRename}
                deleteFolder={deleteFolder}
                deleteNote={deleteNote}
                selectNote={selectNote}
                createNote={createNote}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </DroppableFolder>
  );
}
