import type { QueryStatus } from "@tanstack/react-query";

export const combineStatus = (statuses: QueryStatus[]) => {
  if (statuses.some(status => status === "error")) {
    return "error";
  }
  if (statuses.some(status => status === "pending")) {
    return "pending";
  }
  return "success";
};
