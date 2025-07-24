import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { notesTables } from "./notes/schema";
import { campaignTables } from "./campaigns/schema";
import { editorTables } from "./editors/schema";
import { userTables } from "./users/schema";
import { characterTables } from "./characters/schema";
import { tagTables } from "./tags/schema";

export default defineSchema({
  ...authTables,
  ...notesTables,
  ...editorTables,
  ...campaignTables,
  ...userTables,
  ...characterTables,
  // ...locationTables,
  ...tagTables,
});
