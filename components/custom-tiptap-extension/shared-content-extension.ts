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
            if (this.options.types.includes(node.type.name)) {
              blocks.push({ pos, node });
            }
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
          const cursorPos = selection.from;

          // Find the shareable node that contains the cursor
          let targetBlock: { pos: number; node: ProseMirrorNode } | undefined;

          state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
            const nodeEnd = pos + node.nodeSize;
            if (
              this.options.types.includes(node.type.name) &&
              pos <= cursorPos &&
              cursorPos <= nodeEnd &&
              !targetBlock
            ) {
              targetBlock = { pos, node };
            }
          });

          if (!targetBlock) return false;

          if (!dispatch) return true;

          // Toggle the shared attribute
          const currentShared = targetBlock.node.attrs.shared;
          tr.setNodeAttribute(targetBlock.pos, "shared", !currentShared);

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
            if (this.options.types.includes(node.type.name)) {
              blocks.push({ pos, node });
            }
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
