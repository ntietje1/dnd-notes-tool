/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as campaigns_mutations from "../campaigns/mutations.js";
import type * as campaigns_queries from "../campaigns/queries.js";
import type * as campaigns_types from "../campaigns/types.js";
import type * as editors_mutations from "../editors/mutations.js";
import type * as editors_queries from "../editors/queries.js";
import type * as editors_types from "../editors/types.js";
import type * as http from "../http.js";
import type * as notes_mutations from "../notes/mutations.js";
import type * as notes_queries from "../notes/queries.js";
import type * as notes_types from "../notes/types.js";
import type * as sharedContent from "../sharedContent.js";
import type * as slugify from "../slugify.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "campaigns/mutations": typeof campaigns_mutations;
  "campaigns/queries": typeof campaigns_queries;
  "campaigns/types": typeof campaigns_types;
  "editors/mutations": typeof editors_mutations;
  "editors/queries": typeof editors_queries;
  "editors/types": typeof editors_types;
  http: typeof http;
  "notes/mutations": typeof notes_mutations;
  "notes/queries": typeof notes_queries;
  "notes/types": typeof notes_types;
  sharedContent: typeof sharedContent;
  slugify: typeof slugify;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
