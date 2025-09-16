"use client"

import * as React from "react"
import { z } from "zod"
import { whitelistSchema } from "@/types/whitelist"

export const WhitelistContext = React.createContext<{
  whitelistData: z.infer<typeof whitelistSchema>[]
  setWhitelistData: React.Dispatch<React.SetStateAction<z.infer<typeof whitelistSchema>[] >>
} | null>(null)

export function useWhitelist() {
  const context = React.useContext(WhitelistContext)
  if (!context) {
    throw new Error("useWhitelist must be used within a WhitelistProvider")
  }
  return context
}

export function WhitelistProvider({ children }: { children: React.ReactNode }) {
  const [whitelistData, setWhitelistData] = React.useState<z.infer<typeof whitelistSchema>[]>([])
  return (
    <WhitelistContext.Provider value={{ whitelistData, setWhitelistData }}>
      {children}
    </WhitelistContext.Provider>
  )
}