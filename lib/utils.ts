import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { debounce as _debounce } from "lodash-es";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const debounce = _debounce;
