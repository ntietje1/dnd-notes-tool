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

const FONT_FAMILIES = [
  { name: "Inter", value: "Inter" },
  { name: "Arial", value: "Arial" },
  { name: "Georgia", value: "Georgia" },
  { name: "Times New Roman", value: "Times New Roman" },
  { name: "Courier New", value: "Courier New" },
  { name: "Verdana", value: "Verdana" },
  { name: "Tahoma", value: "Tahoma" },
  { name: "Impact", value: "Impact" },
  { name: "Comic Sans MS", value: "Comic Sans MS" },
  { name: "Lucida Console", value: "Lucida Console" },
  { name: "Arial Black", value: "Arial Black" },
  { name: "Monaco", value: "Monaco" },
  { name: "Palatino", value: "Palatino" },
  { name: "Trebuchet MS", value: "Trebuchet MS" },
  { name: "Garamond", value: "Garamond" },
  { name: "Bookman", value: "Bookman" },
  { name: "Lucida Sans", value: "Lucida Sans" },
  { name: "Lucida Grande", value: "Lucida Grande" },
  { name: "Lucida Sans Unicode", value: "Lucida Sans Unicode" },
  { name: "MS Sans Serif", value: "MS Sans Serif" },
  { name: "MS Serif", value: "MS Serif" },
] as const;

const DEFAULT_FONT = "Arial";

export interface FontFamilyDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null;
  hideWhenUnavailable?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function FontFamilyDropdownMenu({
  editor: providedEditor,
  hideWhenUnavailable = false,
  onOpenChange,
  ...props
}: FontFamilyDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentFont, setCurrentFont] = React.useState(DEFAULT_FONT);
  const editor = useTiptapEditor(providedEditor);

  // Update current font when selection changes
  React.useEffect(() => {
    if (!editor) return;

    const updateCurrentFont = () => {
      const fontFamily = editor.getAttributes("textStyle").fontFamily;
      setCurrentFont(fontFamily || DEFAULT_FONT);
    };

    // Update immediately
    updateCurrentFont();

    // Subscribe to selection changes
    editor.on("selectionUpdate", updateCurrentFont);
    editor.on("transaction", updateCurrentFont);

    return () => {
      editor.off("selectionUpdate", updateCurrentFont);
      editor.off("transaction", updateCurrentFont);
    };
  }, [editor]);

  const handleOnOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

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
          aria-label="Font family"
          tooltip="Font Family"
          className="tiptap-button"
          {...props}
        >
          <span className="truncate w-[80px] text-left inline-block">
            {currentFont}
          </span>
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-fit">
        <DropdownMenuGroup>
          {FONT_FAMILIES.map((font) => (
            <DropdownMenuItem
              key={font.value}
              onSelect={() => {
                editor.chain().focus().setFontFamily(font.value).run();
                setCurrentFont(font.value);
              }}
              className="tiptap-dropdown-item w-full focus:outline-none items-start"
            >
              <Button
                type="button"
                data-style="ghost"
                data-active-state={currentFont === font.value ? "on" : "off"}
                className="w-full text-left"
                role="button"
                tabIndex={-1}
              >
                <span
                  style={{ fontFamily: font.value }}
                  className="truncate w-full"
                >
                  {font.name}
                </span>
              </Button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
