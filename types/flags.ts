import { z } from "zod"

export const flagsSchema = z.object({
  id: z.number(),
  transactionId: z.number(),
  flag: z.string(),
  suspCode: z.string(),
  reason: z.string(),
  score: z.number(),
  suspCodeDesc: z.string(),
  acNum: z.string(),
  name: z.string(),
  type: z.string(),
  amount: z.number(),
  date: z.string(),
  bankCode: z.string(),
  country: z.string(),
  notes: z.string(),
})