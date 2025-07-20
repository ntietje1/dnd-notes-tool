import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface SharedContentOptions {
  types: string[];
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    sharedContent: {
      /**
       * Set the shared attribute on selected blocks
       */
      setSharedContent: () => ReturnType;
      /**
       * Toggle shared attribute on selected blocks
       */
      toggleSharedContent: () => ReturnType;
      /**
       * Unset the shared attribute from selected blocks
       */
      unsetSharedContent: () => ReturnType;
    };
  }
}

export const SharedContentExtension = Extension.create<SharedContentOptions>({
  name: "sharedContent",

  addOptions() {
    return {
      types: [
        "heading",
        "paragraph",
        "bulletList",
        "orderedList",
        "taskList",
        "listItem",
        "taskItem",
        "blockquote",
        "codeBlock",
        "image",
      ],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          shared: {
            default: false,
            parseHTML: (element) =>
              element.getAttribute("data-shared") === "true",
            renderHTML: (attributes) => {
              if (!attributes.shared) {
                return {};
              }
              return {
                "data-shared": "true",
                class: "shared-content",
              };
            },
          },
          sharedBy: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-shared-by"),
            renderHTML: (attributes) => {
              if (!attributes.sharedBy) {
                return {};
              }
              return {
                "data-shared-by": attributes.sharedBy,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setSharedContent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          // Find all shareable nodes in the selection
          const blocks: { pos: number; node: ProseMirrorNode }[] = [];
          state.doc.nodesBetween(from, to, (node, pos) => {
            // Skip list container nodes (bulletList, orderedList, taskList)
            if (node.type.name.endsWith("List")) {
              return true; // Continue traversing into list items
            }

            // For list items, don't traverse into their children
            const isListItem =
              node.type.name === "listItem" || node.type.name === "taskItem";
            if (isListItem) {
              if (this.options.types.includes(node.type.name)) {
                blocks.push({ pos, node });
              }
              return false; // Don't traverse into list item children
            }

            // For non-list items, process normally
            if (!isListItem && this.options.types.includes(node.type.name)) {
              blocks.push({ pos, node });
            }
            return true;
          });

          if (blocks.length === 0) return false;

          if (dispatch) {
            blocks.forEach(({ pos, node }) => {
              tr.setNodeAttribute(pos, "shared", true);
            });
          }

          return true;
        },

      toggleSharedContent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          // Find all shareable nodes in the selection
          const blocks: { pos: number; node: ProseMirrorNode }[] = [];
          state.doc.nodesBetween(from, to, (node, pos) => {
            // Skip list container nodes (bulletList, orderedList, taskList)
            if (node.type.name.endsWith("List")) {
              return true; // Continue traversing into list items
            }

            // For list items, don't traverse into their children
            const isListItem =
              node.type.name === "listItem" || node.type.name === "taskItem";
            if (isListItem) {
              if (this.options.types.includes(node.type.name)) {
                blocks.push({ pos, node });
              }
              return false; // Don't traverse into list item children
            }

            // For non-list items, process normally
            if (!isListItem && this.options.types.includes(node.type.name)) {
              blocks.push({ pos, node });
            }
            return true;
          });

          if (blocks.length === 0) return false;

          if (!dispatch) return true;

          // Check if any block in the selection is already shared
          const hasSharedBlock = blocks.some(({ node }) => node.attrs.shared);

          // If any block is shared, unset all. If none are shared, set all.
          blocks.forEach(({ pos }) => {
            tr.setNodeAttribute(pos, "shared", !hasSharedBlock);
          });

          return true;
        },

      unsetSharedContent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;

          // Find all shareable nodes in the selection
          const blocks: { pos: number; node: ProseMirrorNode }[] = [];
          state.doc.nodesBetween(from, to, (node, pos) => {
            // Skip list container nodes (bulletList, orderedList, taskList)
            if (node.type.name.endsWith("List")) {
              return true; // Continue traversing into list items
            }

            // For list items, don't traverse into their children
            const isListItem =
              node.type.name === "listItem" || node.type.name === "taskItem";
            if (isListItem) {
              if (this.options.types.includes(node.type.name)) {
                blocks.push({ pos, node });
              }
              return false; // Don't traverse into list item children
            }

            // For non-list items, process normally
            if (!isListItem && this.options.types.includes(node.type.name)) {
              blocks.push({ pos, node });
            }
            return true;
          });

          if (blocks.length === 0) return false;

          if (dispatch) {
            blocks.forEach(({ pos, node }) => {
              tr.setNodeAttribute(pos, "shared", false);
            });
          }

          return true;
        },
    };
  },
});
