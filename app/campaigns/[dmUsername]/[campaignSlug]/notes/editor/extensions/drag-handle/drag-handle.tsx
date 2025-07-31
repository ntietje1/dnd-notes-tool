import {
  DragHandleMenu,
  DragHandleMenuProps,
  RemoveBlockItem,
} from "@blocknote/react";

export const CustomDragHandleMenu = (props: DragHandleMenuProps) => (
  <DragHandleMenu {...props}>
    <RemoveBlockItem {...props}>Delete</RemoveBlockItem>
    {/* <BlockColorsItem {...props}>Colors</BlockColorsItem> */}
  </DragHandleMenu>
);
