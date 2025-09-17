import {
  ChevronDown,
  ChevronRight,
  Folder as FolderIcon,
  FolderEdit as FolderEditIcon,
  MoreHorizontal,
} from "~/lib/icons";
import { Button } from "~/components/shadcn/ui/button";
import { FolderName } from "./folder-name";
import { FolderContextMenu } from "./folder-context-menu";
import type { Folder } from "convex/notes/types";
import { DraggableFolder } from "./draggable-folder";
import { useFolderState } from "~/hooks/useFolderState";
import { useFileSidebar } from "~/contexts/FileSidebarContext";
import { toast } from "sonner";

interface FolderButtonProps {
  folder: Folder;
}

export function FolderButton({
  folder,
}: FolderButtonProps) {
  const { isExpanded, toggleExpanded } = useFolderState(folder._id)
  const { renamingId } = useFileSidebar();
  
  const handleFolderClick = () => {
    toast.info("Folder clicked - functionality coming soon!");
  };

  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("More options - functionality coming soon!");
  };
  
  return (
    <DraggableFolder folder={folder}>
       <div className="group relative flex items-center w-full h-8 px-1 rounded-sm hover:bg-muted/50 transition-colors">
         {/* Icon Slot - Folder Icon and Chevron in same position */}
         <div className="relative h-6 w-6 shrink-0">
           {/* Folder Icon - Show by default */}
           <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity text-muted-foreground">
             {renamingId === folder._id ? (
               <FolderEditIcon className="h-4 w-4" />
             ) : (
               <FolderIcon className="h-4 w-4" />
             )}
           </div>
           
           {/* Chevron Button - Show on Hover */}
           <Button
             variant="ghost"
             size="sm"
             className="absolute inset-0 h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/20 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
             onClick={(e) => {
               e.stopPropagation();
               toggleExpanded();
             }}
           > 
             {isExpanded ? (
               <ChevronDown className="h-3 w-3" />
             ) : (
               <ChevronRight className="h-3 w-3" />
             )}
           </Button>
         </div>

         {/* Folder Name */}
         <div 
           className="flex items-center min-w-0 flex-1 px-1 py-1 rounded-sm"
           onClick={handleFolderClick}
         >
           <FolderName folder={folder}/>
         </div>

         {/* Action Buttons - Show on Hover */}
         <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
           <FolderContextMenu folder={folder}>
             <Button
               variant="ghost"
               size="sm"
               className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/20 rounded-sm"
               onClick={handleMoreOptions}
             >
               <MoreHorizontal className="h-4 w-4" />
             </Button>
           </FolderContextMenu>
         </div>
       </div>
    </DraggableFolder>
  );
}
