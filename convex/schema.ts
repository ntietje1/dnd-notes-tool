import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { notesTables } from "./notes/schema";
import { campaignTables } from "./campaigns/schema";
import { editorTables } from "./editors/schema";

export default defineSchema({
  ...authTables,
  ...notesTables,
  ...editorTables,
  ...campaignTables,
});
