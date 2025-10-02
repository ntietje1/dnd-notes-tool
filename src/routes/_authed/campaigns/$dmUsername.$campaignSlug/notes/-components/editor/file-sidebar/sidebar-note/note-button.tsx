import type { Note } from 'convex/notes/types'
import { UNTITLED_NOTE_TITLE } from 'convex/notes/types'
import { useFileSidebar } from '~/contexts/FileSidebarContext'
import { useCurrentNote } from '~/hooks/useCurrentNote'
import { useNoteActions } from '~/hooks/useNoteActions'
import { NoteContextMenu } from './note-context-menu'
import { DraggableNote } from './draggable-note'
import { SidebarItemButtonBase } from '../sidebar-item/sidebar-item-button-base'
import { FileText } from '~/lib/icons'
import { useContextMenu } from '~/hooks/useContextMenu'

interface NoteButtonProps {
  note: Note
}

export function NoteButton({ note }: NoteButtonProps) {
  const { renamingId, setRenamingId } = useFileSidebar()
  const { note: currentNote, selectNote } = useCurrentNote()
  const { updateNote } = useNoteActions()
  const { contextMenuRef, handleMoreOptions } = useContextMenu()
  const isSelected = currentNote?.data?._id === note._id

  const handleFinishRename = async (name: string) => {
    await updateNote.mutateAsync({ noteId: note._id, name })
    setRenamingId(null)
  }

  return (
    <DraggableNote note={note}>
      <NoteContextMenu ref={contextMenuRef} note={note}>
        <SidebarItemButtonBase
          icon={FileText}
          name={note.name || ''}
          defaultName={UNTITLED_NOTE_TITLE}
          isSelected={isSelected}
          isRenaming={renamingId === note._id}
          showChevron={false}
          onSelect={() => selectNote(note._id)}
          onMoreOptions={handleMoreOptions}
          onFinishRename={handleFinishRename}
        />
      </NoteContextMenu>
    </DraggableNote>
  )
}
