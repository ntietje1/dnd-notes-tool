"use client";

import * as React from "react";
import { isNodeSelection, type Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/tiptap-ui-primitive/dropdown-menu";

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 72, 96] as const;
const DEFAULT_FONT_SIZE = 16;

export interface FontSizeDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null;
  hideWhenUnavailable?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function FontSizeDropdownMenu({
  editor: providedEditor,
  hideWhenUnavailable = false,
  onOpenChange,
  ...props
}: FontSizeDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState("");
  const [currentSize, setCurrentSize] = React.useState(DEFAULT_FONT_SIZE);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const editor = useTiptapEditor(providedEditor);

  // Update current size when selection changes
  React.useEffect(() => {
    if (!editor) return;

    const updateCurrentSize = () => {
      if (isEditing) return; // Don't update while editing
      const fontSize = editor.getAttributes("textStyle").fontSize;
      const size = fontSize ? parseInt(fontSize) : DEFAULT_FONT_SIZE;
      setCurrentSize(size);
      if (!isEditing) {
        setEditValue(size.toString());
      }
    };

    updateCurrentSize();
    editor.on("selectionUpdate", updateCurrentSize);
    editor.on("transaction", updateCurrentSize);

    return () => {
      editor.off("selectionUpdate", updateCurrentSize);
      editor.off("transaction", updateCurrentSize);
    };
  }, [editor, isEditing]);

  const handleOnOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setIsEditing(false);
      }
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const handleSizeClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!editor || isEditing) return;
      setIsEditing(true);
      setEditValue(currentSize.toString());
    },
    [editor, isEditing, currentSize],
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setEditValue(e.target.value);
    },
    [],
  );

  const handleInputKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (!editor) return;

      if (e.key === "Enter") {
        e.preventDefault();
        const size = parseInt(editValue);
        if (!isNaN(size) && size > 0) {
          setIsOpen(false);
          editor.chain().focus().setFontSize(`${size}px`).run();
          setCurrentSize(size);
        }
        setIsEditing(false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsEditing(false);
        editor.commands.focus();
      }
    },
    [editValue, editor],
  );

  const handleInputBlur = React.useCallback(() => {
    setIsEditing(false);
  }, []);

  if (!editor || !editor.isEditable) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          role="button"
          tabIndex={-1}
          aria-label="Font size"
          tooltip="Font Size"
          className="tiptap-button"
          {...props}
        >
          <div className="flex items-center gap-1" onClick={handleSizeClick}>
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                className="w-[30px] bg-transparent border-none outline-none text-center"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span className="truncate inline-block min-w-[30px] text-center">
                {currentSize}
              </span>
            )}
          </div>
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[60px]">
        <DropdownMenuGroup>
          {FONT_SIZES.map((size) => (
            <DropdownMenuItem
              key={size}
              onSelect={() => {
                editor.chain().focus().setFontSize(`${size}px`).run();
                setCurrentSize(size);
              }}
              className="tiptap-dropdown-item w-full focus:outline-none"
            >
              <Button
                type="button"
                data-style="ghost"
                data-active-state={currentSize === size ? "on" : "off"}
                className="w-full text-left"
                role="button"
                tabIndex={-1}
              >
                <span>{size}</span>
              </Button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
