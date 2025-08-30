import { DragHandleButton, SideMenu } from "@blocknote/react";
import ShareSideMenuButton from "./share/share-side-menu-button";
import TagSideMenuButton from "./tags/tag-side-menu-button";
import { CustomDragHandleMenu } from "../drag-handle/drag-handle";

export const SideMenuRenderer = (editor: any) => {
    return (props: any) => (
      <SideMenu {...props}>
        <ShareSideMenuButton block={props.block} />
        <TagSideMenuButton editor={editor} block={props.block} />
        <DragHandleButton
          {...props}
          dragHandleMenu={CustomDragHandleMenu}
        />
      </SideMenu>
    );
  };