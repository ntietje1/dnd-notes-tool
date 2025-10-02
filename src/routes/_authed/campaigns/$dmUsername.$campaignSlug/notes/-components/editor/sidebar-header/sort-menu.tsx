import { Button } from '~/components/shadcn/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/shadcn/ui/dropdown-menu'
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ClockArrowDown,
  ClockArrowUp,
  CalendarArrowDown,
  CalendarArrowUp,
  SortAsc,
  SortDesc,
} from '~/lib/icons'
import { SORT_DIRECTIONS, SORT_ORDERS } from 'convex/editors/types'
import type { SortDirection, SortOrder } from 'convex/editors/types'
import { useSortOptions } from '~/hooks/useSortOptions'

export function SortMenu() {
  const { sortOptions, setSortOptions } = useSortOptions()

  const handleSortOrderChange = (value: string) => {
    setSortOptions({ ...sortOptions, order: value as SortOrder })
  }

  const handleSortDirectionChange = (value: string) => {
    setSortOptions({ ...sortOptions, direction: value as SortDirection })
  }

  const handleFoldersAlwaysOnTopChange = (value: boolean) => {
    setSortOptions({ ...sortOptions, foldersAlwaysOnTop: value })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <SortDesc className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={sortOptions.order}
          onValueChange={handleSortOrderChange}
        >
          <DropdownMenuRadioItem value={SORT_ORDERS.Alphabetical}>
            {sortOptions.direction === SORT_DIRECTIONS.Ascending ? (
              <ArrowUpAZ className="mr-2 h-4 w-4" />
            ) : (
              <ArrowDownAZ className="mr-2 h-4 w-4" />
            )}
            Alphabetical
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={SORT_ORDERS.DateCreated}>
            {sortOptions.direction === SORT_DIRECTIONS.Ascending ? (
              <CalendarArrowUp className="mr-2 h-4 w-4" />
            ) : (
              <CalendarArrowDown className="mr-2 h-4 w-4" />
            )}
            Date Created
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={SORT_ORDERS.DateModified}>
            {sortOptions.direction === SORT_DIRECTIONS.Ascending ? (
              <ClockArrowUp className="mr-2 h-4 w-4" />
            ) : (
              <ClockArrowDown className="mr-2 h-4 w-4" />
            )}
            Date Modified
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={sortOptions.direction}
          onValueChange={handleSortDirectionChange}
        >
          <DropdownMenuRadioItem value={SORT_DIRECTIONS.Ascending}>
            <SortAsc className="mr-2 h-4 w-4" />
            Ascending
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={SORT_DIRECTIONS.Descending}>
            <SortDesc className="mr-2 h-4 w-4" />
            Descending
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={sortOptions.foldersAlwaysOnTop}
          onCheckedChange={handleFoldersAlwaysOnTopChange}
        >
          Folders always on top
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
