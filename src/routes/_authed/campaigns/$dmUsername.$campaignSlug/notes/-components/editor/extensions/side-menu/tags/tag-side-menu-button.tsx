import { useState, useRef, useEffect, useMemo } from "react";
import { useTags } from "./use-tags";
import { useNotes } from "~/contexts/NotesContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Badge } from "~/components/shadcn/ui/badge";
import { TagIcon, PlusIcon, Lock, X } from "~/lib/icons";
import { useComponentsContext } from "@blocknote/react";
import { toast } from "sonner";
import {
  Command,
  CommandInput,
} from "~/components/shadcn/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import type { CustomBlockNoteEditor } from "~/lib/editor-schema";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";

interface TagSideMenuButtonProps {
  editor: CustomBlockNoteEditor | null;
  block: any;
}

export default function TagSideMenuButton({
  editor,
  block,
}: TagSideMenuButtonProps) {
  const { tags, nonSystemManagedTags } = useTags();
  const { note } = useNotes();
  const addTagToBlock = useMutation({mutationFn: useConvexMutation(api.notes.mutations.addTagToBlockMutation)});
  const removeTagFromBlock = useMutation({mutationFn: useConvexMutation(
    api.notes.mutations.removeTagFromBlockMutation,
  )});
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  const Components = useComponentsContext()!;

  const blockTagState = useQuery(convexQuery(api.notes.queries.getBlockTagState, note?._id ? {
    noteId: note._id,
    blockId: block.id
  } : "skip"));

  // Prevent BlockNote from moving the side menu when dropdown is open
  useEffect(() => {
    if (!editor) return;
    
    if (isOpen && editor.sideMenu) {
      // Freeze the side menu to prevent it from moving
      editor.sideMenu.freezeMenu();
    } else if (!isOpen && editor.sideMenu) {
      // Unfreeze when dropdown closes
      editor.sideMenu.unfreezeMenu();
    }
  }, [isOpen, editor]);

  const handleAddTag = async (tagId: Id<"tags">) => {
    if (!note) return;

    try {
      await addTagToBlock.mutateAsync({
        noteId: note._id,
        blockId: block.id,
        tagId,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagId: Id<"tags">) => {
    if (!note) return;

    try {
      await removeTagFromBlock.mutateAsync({
        noteId: note._id,
        blockId: block.id,
        tagId,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove tag");
    }
  };

  const inlineTagIds = blockTagState.data?.inlineTagIds || [];
  const manualTagIds = blockTagState.data?.blockTagIds || []; // These are manually added tags (removable)
  const noteTagId = blockTagState.data?.noteTagId || null;
  const allBlockTagIds = blockTagState.data?.allTagIds || [];

  // Tags that are unavailable (locked) include inline tags and the note level tag
  const lockedTagIds = [...inlineTagIds, ...(noteTagId ? [noteTagId] : [])];
  const unavailableTags = nonSystemManagedTags?.filter((tag) => lockedTagIds.includes(tag._id)) || [];
  
  // Available tags are those not already applied to the block
  const availableTags = nonSystemManagedTags?.filter((tag) => !allBlockTagIds.includes(tag._id)) || [];
  const filteredAvailableTags = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableTags;
    return availableTags.filter((t) => t.name.toLowerCase().includes(q));
  }, [availableTags, query]);

  // "+X more" indicator for clamped addable tags
  const addableContainerRef = useRef<HTMLDivElement | null>(null);
  const [hiddenCount, setHiddenCount] = useState(0);

  useEffect(() => {
    const el = addableContainerRef.current;
    if (!el) return;

    const compute = () => {
      if (filteredAvailableTags.length === 0) {
        setHiddenCount(0);
        return;
      }
      const children = Array.from(el.children) as HTMLElement[];
      const containerRect = el.getBoundingClientRect();
      const maxVisibleBottom = containerRect.top + el.clientHeight;
      let visible = 0;
      for (const child of children) {
        const rect = child.getBoundingClientRect();
        if (rect.bottom <= maxVisibleBottom + 0.5) {
          visible += 1;
        }
      }
      setHiddenCount(Math.max(0, children.length - visible));
    };

    // Initial measure next frame after layout
    const raf = requestAnimationFrame(compute);
    const onResize = () => requestAnimationFrame(compute);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [filteredAvailableTags, isOpen]);


  // Map manual tag ids to tag objects
  const manualTagObjects = manualTagIds
    .map((tagId: Id<"tags">) => tags?.find((t) => t._id === tagId))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

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
        <DropdownMenu open onOpenChange={(open) => { if (!open) { setIsOpen(false); setTimeout(() => editor?.focus(), 0); } }}>
          <DropdownMenuTrigger asChild>
            <div />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" sideOffset={12} collisionPadding={12} className="w-72 max-h-(--radix-dropdown-menu-content-available-height) overflow-y-auto">
            {(unavailableTags.length > 0 || manualTagObjects.length > 0) && (
              <div className="px-2 pt-1 pb-2">
                <div className="text-xs text-muted-foreground mb-1.5">Current tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {unavailableTags.map((tag) => (
                    <div key={`inline-${tag._id}`} className="group">
                      <Badge
                        variant="secondary"
                        style={{
                          // @ts-ignore - allow CSS var injection
                          "--tag-bg": `${tag.color}20`,
                          // @ts-ignore
                          "--tag-fg": `${tag.color}`,
                        }}
                        className="inline-flex items-center py-1 transition-colors bg-[var(--tag-bg)] text-[var(--tag-fg)]"
                      >
                        <Lock aria-hidden className="opacity-0" />
                        <span>{tag.name}</span>
                        <Lock aria-hidden className="opacity-0 transition-opacity group-hover:opacity-100" />
                      </Badge>
                    </div>
                  ))}

                  {manualTagObjects.map((tag) => (
                    <button
                      key={`manual-${tag._id}`}
                      type="button"
                      aria-label={`Remove tag ${tag.name}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveTag(tag._id);
                      }}
                      className="group inline-block focus-visible:outline-none cursor-pointer"
                    >
                      <Badge
                        variant="secondary"
                        style={{
                          // @ts-ignore
                          "--tag-bg": `${tag.color}20`,
                          // @ts-ignore
                          "--tag-fg": `${tag.color}`,
                        }}
                        className="inline-flex items-center py-1 transition-colors bg-[var(--tag-bg)] text-[var(--tag-fg)] hover:bg-red-500 hover:text-white group-hover:bg-red-500 group-hover:text-white"
                      >
                        <X aria-hidden className="opacity-0" />
                        <span>{tag.name}</span>
                        <X aria-hidden className="opacity-0 transition-opacity group-hover:opacity-100" />
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Command className="rounded-md">
              <CommandInput
                autoFocus
                placeholder="Search tags..."
                className="h-6"
                value={query}
                onValueChange={setQuery}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const first = filteredAvailableTags[0];
                    if (first) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddTag(first._id);
                    }
                  }
                }}
              />
              <div className="p-2">
                <div className="text-xs text-muted-foreground mb-1.5">Add tags</div>
                <div ref={addableContainerRef} className="flex flex-wrap gap-1.5 max-h-30 overflow-hidden">
                  {filteredAvailableTags.map((tag) => (
                    <button
                      key={`available-${tag._id}`}
                      type="button"
                      aria-label={`Add tag ${tag.name}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddTag(tag._id);
                      }}
                      className={`group inline-block focus-visible:outline-none`}
                      style={{
                        // @ts-ignore
                        "--tag-bg": `${tag.color}20`,
                        // @ts-ignore
                        "--tag-fg": `${tag.color}`,
                      }}
                    >
                      <Badge
                        variant="secondary"
                        className="inline-flex items-center py-1 transition-colors bg-[var(--tag-bg)] text-[var(--tag-fg)] hover:!bg-green-500 hover:!text-white group-hover:!bg-green-500 group-hover:!text-white"
                      >
                        <PlusIcon aria-hidden className="opacity-0" />
                        <span>{tag.name}</span>
                        <PlusIcon aria-hidden className="opacity-0 transition-opacity group-hover:opacity-100" />
                      </Badge>
                    </button>
                  ))}
                  {filteredAvailableTags.length === 0 && (
                    <div className="text-xs text-muted-foreground px-1 py-1">No tags found.</div>
                  )}
                </div>
                {hiddenCount > 0 && (
                  <div className="mt-1">
                    <Badge variant="outline" className="px-2 py-1 text-xs">+{hiddenCount} more</Badge>
                  </div>
                )}
              </div>
            </Command>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
