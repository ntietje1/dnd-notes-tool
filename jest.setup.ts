// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock window.getSelection for Tiptap tests
window.getSelection = () => {
  const selection = {
    addRange: () => {},
    removeAllRanges: () => {},
    getRangeAt: () => null,
    toString: () => "",
    anchorNode: null,
    anchorOffset: 0,
    focusNode: null,
    focusOffset: 0,
    isCollapsed: true,
    rangeCount: 0,
    type: "None",
    extend: () => {},
    collapse: () => {},
    collapseToStart: () => {},
    collapseToEnd: () => {},
    selectAllChildren: () => {},
    setBaseAndExtent: () => {},
    setPosition: () => {},
    deleteFromDocument: () => {},
    containsNode: () => false,
    empty: () => {},
    // Add missing properties with no-op implementations
    direction: "forward",
    modify: () => {},
    removeRange: () => {},
  };
  return selection as unknown as Selection;
};
