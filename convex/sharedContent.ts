import { query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to get base user ID from OAuth subject (keep in sync with notes.ts)
const getBaseUserId = (subject: string) => subject.split("|")[0];
