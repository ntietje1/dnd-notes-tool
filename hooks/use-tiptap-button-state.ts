import * as React from "react";
import { Editor } from "@tiptap/react";

export interface UseTiptapButtonStateProps<T extends Record<string, any> = {}> {
  editor: Editor | null;
  isActive: (editor: Editor, attrs?: T) => boolean;
  attrs?: T;
}

export function useTiptapButtonState<T extends Record<string, any> = {}>({
  editor,
  isActive,
  attrs,
}: UseTiptapButtonStateProps<T>): boolean {
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    if (!editor) return;

    const updateState = () => {
      setActive(isActive(editor, attrs));
    };

    // Update immediately
    updateState();

    // Subscribe to selection changes
    editor.on("selectionUpdate", updateState);
    editor.on("transaction", updateState);

    return () => {
      editor.off("selectionUpdate", updateState);
      editor.off("transaction", updateState);
    };
  }, [editor, isActive, attrs]);

  return active;
}
