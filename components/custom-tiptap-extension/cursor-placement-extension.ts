import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { TextSelection } from "@tiptap/pm/state";

export const CursorPlacement = Extension.create({
  name: "cursorPlacement",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              // Get click coordinates relative to the editor
              const pos = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });

              if (pos) {
                // Set selection at clicked position
                const tr = view.state.tr.setSelection(
                  TextSelection.near(view.state.doc.resolve(pos.pos)),
                );
                view.dispatch(tr);
              }
              return false; // Let other handlers run
            },
          },
        },
      }),
    ];
  },
});
