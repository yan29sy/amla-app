import { z } from "zod"

export const whitelistSchema = z.object({
  id: z.number(),
  acNum: z.string(),
  name: z.string(),
  reason: z.string(), // Reason for whitelisting
  dateAdded: z.string(), // ISO date
  addedBy: z.string(), // User ID who added to whitelist
})