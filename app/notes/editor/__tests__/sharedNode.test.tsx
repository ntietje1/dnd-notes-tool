import { Editor } from "@tiptap/core";
import { SharedNode } from "../sharedNode";
import StarterKit from "@tiptap/starter-kit";
import singleSharedContent from "./fixtures/single-shared-content.json";

describe("SharedNode Extension", () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor({
      extensions: [StarterKit, SharedNode],
    });
  });

  afterEach(() => {
    editor.destroy();
  });

  describe("toggleSharedNode command", () => {
    it("should remove shared node when selection is inside it", () => {
      // Load the content with a shared node
      editor.commands.setContent(singleSharedContent);

      // Verify initial state has shared node
      expect(editor.isActive("sharedNode")).toBe(false); // Not active yet because no selection

      // Set cursor inside the shared content
      editor.commands.focus(); // Focus at start
      editor.commands.setTextSelection(15); // Position cursor in middle of "This is shared content"

      // Verify we're inside shared node
      expect(editor.isActive("sharedNode")).toBe(true);

      // Toggle the shared node
      editor.commands.toggleSharedNode();

      // Verify shared node was removed
      expect(editor.isActive("sharedNode")).toBe(false);

      // Verify the content structure
      expect(editor.getJSON()).toEqual({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This is shared content",
              },
            ],
          },
        ],
      });
    });

    it("should handle cursor at different positions within shared node", () => {
      editor.commands.setContent(singleSharedContent);

      const positions = [1, 15, 25]; // Start, middle, end of text

      for (const pos of positions) {
        // Reset content for each test
        editor.commands.setContent(singleSharedContent);
        editor.commands.focus();
        editor.commands.setTextSelection(pos);

        expect(editor.isActive("sharedNode")).toBe(true);
        editor.commands.toggleSharedNode();
        expect(editor.isActive("sharedNode")).toBe(false);
      }
    });
  });
});
