import React, { useState, useRef, useEffect } from "react";
import { useTags } from "./use-tags";
import { useNotes } from "@/contexts/NotesContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CustomBlockNoteEditor } from "./tags";
import { Badge } from "@/components/ui/badge";
import { TagIcon, PlusIcon, CheckIcon } from "lucide-react";
import { useComponentsContext } from "@blocknote/react";

interface TagSideMenuButtonProps {
  editor: CustomBlockNoteEditor;
  block: any;
}

export default function TagSideMenuButton({
  editor,
  block,
}: TagSideMenuButtonProps) {
  const { tags } = useTags();
  const { currentNote } = useNotes();
  const addTagToBlock = useMutation(api.notes.mutations.addTagToBlock);
  const removeTagFromBlock = useMutation(
    api.notes.mutations.removeTagFromBlock,
  );
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const Components = useComponentsContext()!;

  const blockTags = useQuery(api.notes.queries.getBlockTags, {
    noteId: currentNote?._id!,
    blockId: block.id,
  });

  // Prevent BlockNote from moving the side menu when dropdown is open
  useEffect(() => {
    if (isOpen && editor.sideMenu) {
      // Freeze the side menu to prevent it from moving
      editor.sideMenu.freezeMenu();
    } else if (!isOpen && editor.sideMenu) {
      // Unfreeze when dropdown closes
      editor.sideMenu.unfreezeMenu();
    }
  }, [isOpen, editor]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleAddTag = async (tagId: Id<"tags">) => {
    if (!currentNote?._id) return;

    await addTagToBlock({
      noteId: currentNote._id,
      blockId: block.id,
      tagId,
    });
  };

  const handleRemoveTag = async (tagId: Id<"tags">) => {
    if (!currentNote?._id) return;

    await removeTagFromBlock({
      noteId: currentNote._id,
      blockId: block.id,
      tagId,
    });
  };

  const currentBlockTags = blockTags || [];
  const availableTags =
    tags?.filter((tag) => !currentBlockTags.includes(tag._id)) || [];

  return (
    <div ref={buttonRef} className="relative flex items-center">
      <Components.SideMenu.Button
        label="Add Tags"
        className="!p-0 !px-0 !h-6 !w-6"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        icon={<TagIcon size={18} />}
      />

      {isOpen && (
        <div
          className="absolute left-full ml-2 top-0 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]"
          style={{ minWidth: "256px" }}
        >
          <div className="p-2">
            <div className="px-2 py-1.5 text-sm font-medium">Block Tags</div>
            <div className="border-t border-gray-200 my-2"></div>

            {/* Current tags */}
            {currentBlockTags.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Current tags:
                </div>
                {currentBlockTags.map((tagId) => {
                  const tag = tags?.find((t) => t._id === tagId);
                  if (!tag) return null;

                  return (
                    <div
                      key={tagId}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveTag(tagId);
                      }}
                      className="flex items-center justify-between cursor-pointer px-2 py-1.5 hover:bg-gray-100 rounded"
                    >
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </Badge>
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </div>
                  );
                })}
                <div className="border-t border-gray-200 my-2"></div>
              </>
            )}

            {/* Available tags */}
            {availableTags.length > 0 ? (
              <>
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Add tag:
                </div>
                {availableTags.map((tag) => (
                  <div
                    key={tag._id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddTag(tag._id);
                    }}
                    className="flex items-center justify-between cursor-pointer px-2 py-1.5 hover:bg-gray-100 rounded"
                  >
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </Badge>
                    <PlusIcon className="h-3 w-3" />
                  </div>
                ))}
              </>
            ) : (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No more tags available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
