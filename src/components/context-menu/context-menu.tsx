import { useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/shadcn/ui/dropdown-menu";
import { cn } from "~/lib/utils";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
}

interface ContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  className?: string;
  menuClassName?: string;
}

//TODO: switch to shadcn/ui/context-menu
export function ContextMenu({
  children,
  items,
  className,
  menuClassName = "w-48",
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        x: e.clientX + 4,
        y: e.clientY + 4,
      });
    }
    setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  return (
    <div
      ref={wrapperRef}
      className={cn("relative w-full", className)}
      onContextMenu={handleContextMenu}
    >
      {children}
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange} modal={false}>
        <DropdownMenuContent
          className={menuClassName}
          style={{
            position: "absolute",
            top: position.y,
            left: position.x,
          }}
          sideOffset={0}
          alignOffset={0}
        >
          {items.map((item, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => handleItemClick(item.onClick)}
              className={item.className}
            >
              {item.icon && <span className="h-4 w-4 mr-2">{item.icon}</span>}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
