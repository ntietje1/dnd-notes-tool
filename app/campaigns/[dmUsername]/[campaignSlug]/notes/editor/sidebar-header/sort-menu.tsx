"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ClockArrowDown,
  ClockArrowUp,
  CalendarArrowUp,
  CalendarArrowDown,
  SortAsc,
} from "lucide-react";
import { useNotes, SortDirection, SortOrder } from "@/contexts/NotesContext";

export function SortMenu() {
  const { sortOptions, setSortOptions } = useNotes();

  const sortOrderIcons = {
    alphabetical: sortOptions.direction === "asc" ? ArrowUpAZ : ArrowDownAZ,
    dateCreated:
      sortOptions.direction === "asc" ? CalendarArrowUp : CalendarArrowDown,
    dateModified:
      sortOptions.direction === "asc" ? ClockArrowUp : ClockArrowDown,
  };

  const Icon = sortOrderIcons[sortOptions.order];

  const handleSortOrderChange = (value: string) => {
    setSortOptions({ ...sortOptions, order: value as SortOrder });
  };

  const handleSortDirectionChange = (value: string) => {
    setSortOptions({ ...sortOptions, direction: value as SortDirection });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={sortOptions.order}
          onValueChange={handleSortOrderChange}
        >
          <DropdownMenuRadioItem value="alphabetical">
            {sortOptions.direction === "asc" ? (
              <ArrowUpAZ className="mr-2 h-4 w-4" />
            ) : (
              <ArrowDownAZ className="mr-2 h-4 w-4" />
            )}
            Alphabetical
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dateCreated">
            {sortOptions.direction === "asc" ? (
              <CalendarArrowUp className="mr-2 h-4 w-4" />
            ) : (
              <CalendarArrowDown className="mr-2 h-4 w-4" />
            )}
            Date Created
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dateModified">
            {sortOptions.direction === "asc" ? (
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
          <DropdownMenuRadioItem value="asc">
            <SortAsc className="mr-2 h-4 w-4" />
            Ascending
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="desc">
            <SortAsc className="mr-2 h-4 w-4 rotate-180" />
            Descending
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
