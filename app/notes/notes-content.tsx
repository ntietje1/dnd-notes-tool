import { useNotes } from "@/contexts/NotesContext";
import { FileSidebar } from "@/components/file-sidebar/sidebar";
import { FileTopbar } from "@/components/file-topbar/topbar";
import { SimpleEditor } from "@/components/custom-tiptap-ui/editor/editor";

export function NotesSidebar() {
  const {
    currentNoteId,
    expandedFolders,
    sidebarData,
    selectNote,
    createNote,
    createFolder,
    deleteNote,
    deleteFolder,
    moveNote,
    toggleFolder,
    openFolder,
    updateNoteTitle,
    updateFolderName,
  } = useNotes();

  if (!sidebarData) return null;

  return (
    <FileSidebar
      selectedNoteId={currentNoteId}
      expandedFolders={expandedFolders}
      onNoteSelected={selectNote}
      onCreateNote={createNote}
      onCreateFolder={createFolder}
      onDeleteNote={deleteNote}
      onDeleteFolder={deleteFolder}
      onRenameNote={updateNoteTitle}
      onRenameFolder={updateFolderName}
      onMoveNote={moveNote}
      onToggleFolder={toggleFolder}
      onOpenFolder={openFolder}
    />
  );
}

export function NotesEditor() {
  const { selectedNote, updateNoteContent, updateNoteTitle } = useNotes();

  if (!selectedNote) {
    return <div>Select a note to begin editing</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <FileTopbar note={selectedNote} onTitleChange={updateNoteTitle} />
      <SimpleEditor
        content={selectedNote.content}
        onUpdate={updateNoteContent}
      />
    </div>
  );
}
