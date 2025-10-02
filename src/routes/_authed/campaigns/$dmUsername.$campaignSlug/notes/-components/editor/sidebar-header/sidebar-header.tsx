import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/shadcn/ui/tooltip'
import { SortMenu } from './sort-menu'

export function SidebarHeader() {
  return (
    <div className="flex items-center justify-between px-2 pl-4 h-12 border-b bg-background">
      <h2 className="text-lg font-semibold">Files</h2>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <SortMenu />
          </TooltipTrigger>
          <TooltipContent>Sort by</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
