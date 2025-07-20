import * as React from "react";
import { ShareIcon } from "./share-icon";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Editor } from "@tiptap/react";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";
import { useTiptapButtonState } from "@/hooks/use-tiptap-button-state";

export interface ShareButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  editor?: Editor | null;
  hideWhenUnavailable?: boolean;
}

function canToggleShare(editor: Editor | null): boolean {
  if (!editor) return false;

  const { selection } = editor.state;
  const cursorPos = selection.from;

  // Check if cursor is inside a block node (excluding doc)
  let isInBlockNode = false;
  editor.state.doc.nodesBetween(
    0,
    editor.state.doc.content.size,
    (node, pos) => {
      const nodeEnd = pos + node.nodeSize;
      if (
        node.isBlock &&
        node.type.name !== "doc" &&
        pos <= cursorPos &&
        cursorPos <= nodeEnd &&
        !isInBlockNode
      ) {
        isInBlockNode = true;
      }
    },
  );

  return isInBlockNode;
}

function isShareButtonDisabled(
  editor: Editor | null,
  userDisabled: boolean = false,
): boolean {
  if (!editor) return true;
  if (userDisabled) return true;
  if (!canToggleShare(editor)) return true;
  return false;
}

function shouldShowShareButton(params: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}): boolean {
  const { editor, hideWhenUnavailable } = params;

  if (!editor) {
    return false;
  }

  if (hideWhenUnavailable) {
    if (!canToggleShare(editor)) {
      return false;
    }
  }

  return true;
}

export const ShareButton = React.forwardRef<
  HTMLButtonElement,
  ShareButtonProps
>(
  (
    {
      editor: providedEditor,
      hideWhenUnavailable = false,
      className = "",
      disabled,
      onClick,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const editor = useTiptapEditor(providedEditor);
    const isDisabled = isShareButtonDisabled(editor, disabled);
    const isActive = useTiptapButtonState({
      editor,
      isActive: (editor) => {
        const { selection } = editor.state;
        const cursorPos = selection.from;

        // Find the current node containing the cursor and check if it has shared attribute
        let hasSharedAttribute = false;
        editor.state.doc.nodesBetween(
          0,
          editor.state.doc.content.size,
          (node, pos) => {
            const nodeEnd = pos + node.nodeSize;
            if (pos <= cursorPos && cursorPos <= nodeEnd && node.attrs.shared) {
              hasSharedAttribute = true;
            }
          },
        );
        return hasSharedAttribute;
      },
    });

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);

        if (!e.defaultPrevented && !isDisabled && editor) {
          editor.chain().focus().toggleSharedContent().run();
        }
      },
      [onClick, isDisabled, editor],
    );

    const show = React.useMemo(() => {
      return shouldShowShareButton({
        editor,
        hideWhenUnavailable,
      });
    }, [editor, hideWhenUnavailable]);

    if (!show || !editor || !editor.isEditable) {
      return null;
    }

    return (
      <Button
        type="button"
        className={className.trim()}
        disabled={isDisabled}
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        data-disabled={isDisabled}
        role="button"
        tabIndex={-1}
        aria-label="share"
        aria-pressed={isActive}
        tooltip="Share"
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children || <ShareIcon className="tiptap-button-icon" />}
      </Button>
    );
  },
);

ShareButton.displayName = "ShareButton";
