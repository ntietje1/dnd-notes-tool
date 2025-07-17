import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    linkCursor: {
      /**
       * Toggle link cursor behavior
       */
      toggleLinkCursor: () => ReturnType;
    };
  }
}

export const LinkCursor = Extension.create({
  name: "linkCursor",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "link-cursor",
      },
    };
  },

  onCreate() {
    // Add initial styles
    if (typeof window !== "undefined") {
      const style = document.createElement("style");
      style.textContent = `
        .ProseMirror a {
          cursor: text;
        }
        :root.ctrl-pressed .ProseMirror a {
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);

      // Set up event listeners
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
          document.documentElement.classList.add("ctrl-pressed");
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (!e.ctrlKey && !e.metaKey) {
          document.documentElement.classList.remove("ctrl-pressed");
        }
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          document.documentElement.classList.remove("ctrl-pressed");
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Store cleanup function
      this.storage.cleanup = () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        document.documentElement.classList.remove("ctrl-pressed");
        document.head.removeChild(style);
      };
    }
  },

  onDestroy() {
    // Clean up event listeners and styles
    if (typeof window !== "undefined" && this.storage.cleanup) {
      this.storage.cleanup();
    }
  },
});
