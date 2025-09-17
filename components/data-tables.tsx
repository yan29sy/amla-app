"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react"
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { useRef, useState, useEffect, useMemo } from "react"
import * as XLSX from "xlsx"
import { useId } from "react"
import { differenceInDays, parseISO, format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { z } from "zod"
import { transactionSchema } from "@/types/transactions"
import { flagsSchema } from "@/types/flags"
import { whitelistSchema } from "@/types/whitelist"
import { useWhitelist } from "@/contexts/whitelist-context"
import { SetThresh } from "@/components/set-thresh"
import { SetFlags } from "@/components/set-flags"
import { transactionColumns, flagsColumns } from "@/components/table-columns"

// Constants
const HIGH_RISK_COUNTRIES = ['CU', 'IR', 'KP', 'SY']
const SUSP_CODE_DESCRIPTIONS: Record<string, string> = {
  SC1: 'No underlying legal or trade obligation',
  SC2: 'Suspicious use of same email for multiple accounts',
  SC3: 'Amount not commensurate with client capacity',
  SC4: 'Unusual cash transaction activity',
  SC5: 'Unusual activity after inactivity or contact changes',
  PC1: 'High cumulative cash deposits',
}

// Interfaces
interface BuySellRow {
  'DATE'?: string | number | Date;
  'CONF NO.'?: string | number;
  'CUSTOMER CODE'?: string | number;
  'CUSTOMER NAME'?: string;
  'A/E'?: string;
  'STOCK CODE'?: string;
  'NO. OF SHARES'?: number;
  'UNIT PRICE'?: number;
  'CLEARING ACCOUNT'?: string | number;
  'COMM.'?: number;
  'VAT PAYABLE'?: number;
  'DST'?: number;
  'TRANSFER FEE'?: number;
  'VAT WTAX'?: number;
  'PSE FEE'?: number;
  'SCCP FEE/PDC FEE'?: string | number;
  'CUSTOMER ACCOUNT'?: string | number;
  'USER'?: string | number;
  'STAT'?: string;
}

interface DepositRow {
  'DATE'?: string | number | Date;
  'O.R. NO.'?: string | number;
  'A/C#'?: string | number;
  'NAME OF CUSTOMERS'?: string;
  'AMOUNT'?: number;
  'BANK CODE'?: string | number;
  'CHECK NO.'?: string | number;
  'CHECK DATE'?: string | number | Date;
  'USER ID'?: string | number;
  'STAT'?: string;
}

interface RawFlag {
  flag: string;
  susp_code: string;
  reason: string;
  'A/C#'?: string;
  'NAME OF CUSTOMERS'?: string;
  Type?: string;
  AMOUNT?: number;
  DATE?: string;
  'BANK CODE'?: string;
}

interface Thresholds {
  high_value: number;
  cash_deposit: number;
  time_period_days: number;
  quick_withdraw_pct: number;
  customer_cash_total: number;
  num_deposits: number;
  multiple_deposits_total: number;
  inactivity_days: number;
  position_threshold: number;
  undeployed_cash: number;
  num_contact_changes: number;
}

interface FlagScores {
  [key: string]: number;
}

interface AuditLogEntry {
  timestamp: string;
  userId: string;
  action: string;
  details: Record<string, any>;
}

export function DataTable({
  transactions: initialTransactionData = [],
  flags: initialFlagsData = [],
}: {
  transactions?: z.infer<typeof transactionSchema>[]
  flags?: z.infer<typeof flagsSchema>[]
}) {
  const { whitelistData, setWhitelistData } = useWhitelist()
  const [transactionData, setTransactionData] = useState<z.infer<typeof transactionSchema>[]>(initialTransactionData)
  const [flagsData, setFlagsData] = useState<z.infer<typeof flagsSchema>[]>(initialFlagsData)
  const [thresholds, setThresholds] = useState<Thresholds>({
    high_value: 500000,
    cash_deposit: 100000,
    time_period_days: 30,
    quick_withdraw_pct: 50,
    customer_cash_total: 1000000,
    num_deposits: 3,
    multiple_deposits_total: 500000,
    inactivity_days: 90,
    position_threshold: 1000000,
    undeployed_cash: 500000,
    num_contact_changes: 2,
  })
  const [flagScores, setFlagScores] = useState<FlagScores>({
    high_value: 1,
    cash_deposit: 1,
    quick_withdraw: 1,
    customer_cash_total: 1,
    multiple_deposits: 1,
    deposit_high_risk: 1,
    flagged_account: 1,
    total_value_over_time: 1,
    inactivity_deposit: 1,
    position_employment: 1,
    undeployed_cash: 1,
    contact_changes: 1,
    same_email_different_names: 1,
  })
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [rowSelection, setRowSelection] = useState({})
  const [transactionColumnVisibility, setTransactionColumnVisibility] = useState<VisibilityState>({
    contactChanges: false,
    mot: false,
    purpose: false,
    productType: false,
    idType: false,
    idNo: false,
    sourceFund: false,
    currencyCode: false,
    cityCode: false,
    select: true,
  })
  const [flagsColumnVisibility, setFlagsColumnVisibility] = useState<VisibilityState>({
    reason: false,
    suspCodeDesc: false,
    notes: true,
  })
  const [transactionFilters, setTransactionFilters] = useState<ColumnFiltersState>([])
  const [flagsFilters, setFlagsFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [importType, setImportType] = useState<"Deposit" | "Withdrawal" | "Buy/Sell" | null>(null)
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [currentFlagId, setCurrentFlagId] = useState<number | null>(null)
  const [noteText, setNoteText] = useState("")
  const [isWhitelistDialogOpen, setIsWhitelistDialogOpen] = useState(false)
  const [whitelistForm, setWhitelistForm] = useState({ reason: "", addedBy: "" })
  const sortableId = useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )
  const fileRef = useRef<HTMLInputElement | null>(null)
  const isMobile = useIsMobile()

  // Process Excel/CSV file
  const processSheet = (data: (string | number | Date | undefined)[][], importType: "Deposit" | "Withdrawal" | "Buy/Sell"): z.infer<typeof transactionSchema>[] => {
    const buySellHeaders = [
      'DATE', 'CONF NO.', 'CUSTOMER CODE', 'CUSTOMER NAME', 'A/E', 'STOCK CODE',
      'NO. OF SHARES', 'UNIT PRICE', 'CLEARING ACCOUNT', 'COMM.', 'VAT PAYABLE',
      'DST', 'TRANSFER FEE', 'VAT WTAX', 'PSE FEE', 'SCCP FEE/PDC FEE',
      'CUSTOMER ACCOUNT', 'USER', 'STAT'
    ] as const
    const depositHeaders = [
      'DATE', 'O.R. NO.', 'A/C#', 'NAME OF CUSTOMERS', 'AMOUNT', 'BANK CODE',
      'CHECK NO.', 'CHECK DATE', 'USER ID', 'STAT'
    ] as const
    const buySellColumnIndices = [0, 1, 2, 5, 6, 8, 11, 13, 16, 19, 22, 25, 27, 29, 30, 33, 35, 38, 41]
    const depositColumnIndices = [0, 3, 8, 10, 19, 23, 27, 29, 31, 33]
    const minColumns = importType === "Buy/Sell" ? 19 : 10
    const minNonEmpty = importType === "Buy/Sell" ? 5 : 2

    console.log(`Processing ${data.length} rows for ${importType}`)
    if (data.length > 0 && data[0].length < minColumns) {
      console.warn(`File has ${data[0].length} columns, expected at least ${minColumns}. Attempting to process.`)
      toast.warning(`File has ${data[0].length} columns, expected at least ${minColumns}`)
    }

    const headers = importType === "Buy/Sell" ? buySellHeaders : depositHeaders
    const columnIndices = importType === "Buy/Sell" ? buySellColumnIndices : depositColumnIndices

    let processedData: (BuySellRow | DepositRow)[] = data
      .slice(importType === "Buy/Sell" ? 15 : 13)
      .map((row, rowIndex) => {
        const selectedRow = columnIndices.map(index => row[index] !== undefined ? row[index] : '')
        const obj: { [key: string]: string | number | Date | undefined } = {}
        headers.forEach((header, i) => {
          obj[header] = selectedRow[i]
        })
        console.log(`Row ${rowIndex + 1} after column selection:`, obj)
        return obj as BuySellRow | DepositRow
      })
      .filter((row, rowIndex) => {
        const isInvalid = Object.values(row).some(cell =>
          typeof cell === 'string' &&
          (cell.toLowerCase().includes('invoice total') ||
           cell.toLowerCase().includes('grand total') ||
           cell.toLowerCase().includes('sub total'))
        )
        if (isInvalid) {
          console.log(`Row ${rowIndex + 1} filtered out due to invalid content`)
          return false
        }
        return true
      })
      .filter((row, rowIndex) => {
        const nonEmptyCount = Object.values(row).filter(val => val !== '' && val != null && val !== undefined).length
        if (nonEmptyCount < minNonEmpty) {
          console.log(`Row ${rowIndex + 1} filtered out: only ${nonEmptyCount} non-empty values`)
          return false
        }
        return true
      })

    let globalSellingMode = false
    if (importType === "Buy/Sell") {
      let lastConfNo = ''
      let lastCustomerCode = ''
      processedData = processedData.filter((row: BuySellRow, rowIndex) => {
        if (row['DATE'] && typeof row['DATE'] === 'string') {
          const dateLower = row['DATE'].toLowerCase()
          if (dateLower === 'selling') {
            globalSellingMode = true
            console.log(`Row ${rowIndex + 1} filtered out: Selling marker`)
            return false
          }
          if (dateLower === 'buying') {
            globalSellingMode = false
            console.log(`Row ${rowIndex + 1} filtered out: Buying marker`)
            return false
          }
        }
        row['CONF NO.'] = row['CONF NO.'] || lastConfNo
        row['CUSTOMER CODE'] = row['CUSTOMER CODE'] || lastCustomerCode
        lastConfNo = row['CONF NO.'] || lastConfNo
        lastCustomerCode = row['CUSTOMER CODE'] || lastCustomerCode
        console.log(`Row ${rowIndex + 1} after forward fill:`, row)
        return true
      })
    }

    let lastDate: string | undefined = undefined
    processedData = processedData.map((row: BuySellRow | DepositRow, rowIndex) => {
      if (row['DATE']) {
        try {
          const date = new Date(row['DATE'])
          if (!isNaN(date.getTime())) {
            lastDate = date.toISOString().split('T')[0]
            row['DATE'] = lastDate
          } else {
            row['DATE'] = lastDate
          }
        } catch {
          row['DATE'] = lastDate
        }
      } else {
        row['DATE'] = lastDate
      }
      console.log(`Row ${rowIndex + 1} after date processing:`, row)
      return row
    })

    processedData = processedData.filter((row, rowIndex) => {
      if (row['DATE'] === undefined) {
        console.log(`Row ${rowIndex + 1} filtered out: undefined DATE`)
        return false
      }
      return true
    })

    const mappedData = processedData.map((row: BuySellRow | DepositRow, index: number) => {
      const baseTransaction: z.infer<typeof transactionSchema> = {
        id: transactionData.length + index + 1,
        date: row['DATE'] ? String(row['DATE']) : new Date().toISOString().split('T')[0],
        orNo: String((importType === "Buy/Sell" ? row['CONF NO.'] : row['O.R. NO.']) || ''),
        acNum: String((importType === "Buy/Sell" ? row['CUSTOMER ACCOUNT'] : row['A/C#']) || ''),
        name: String((importType === "Buy/Sell" ? row['CUSTOMER NAME'] : row['NAME OF CUSTOMERS']) || ''),
        amount: Number(row['AMOUNT'] || 0),
        bankCode: String((importType === "Buy/Sell" ? row['CLEARING ACCOUNT'] : row['BANK CODE']) || ''),
        country: '',
        isCash: importType === "Buy/Sell" ? false : true,
        checkNo: importType === "Buy/Sell" ? '' : String(row['CHECK NO.'] || ''),
        checkDate: importType === "Buy/Sell" ? '' : (row['CHECK DATE'] ? new Date(row['CHECK DATE']).toISOString().split('T')[0] : ''),
        userId: String((importType === "Buy/Sell" ? row['USER'] : row['USER ID']) || ''),
        stat: String(row['STAT'] || ''),
        type: importType === "Buy/Sell" ? ((row as BuySellRow)['A/E'] === 'B' ? 'Buy' : 'Sell') : importType,
        email: '',
        employmentStatus: '',
        isFlagged: false,
        flagReason: '',
        balance: 0,
        contactChanges: '',
        mot: 0,
        purpose: '',
        productType: importType === "Buy/Sell" ? String((row as BuySellRow)['STOCK CODE'] || '') : '',
        idType: '',
        idNo: '',
        sourceFund: '',
        currencyCode: 'USD',
        cityCode: '',
      }
      try {
        const validated = transactionSchema.parse(baseTransaction)
        console.log(`Processed row ${index + 1}:`, validated)
        return validated
      } catch (error) {
        console.error(`Invalid transaction data at index ${index}:`, error)
        return null
      }
    }).filter((item): item is z.infer<typeof transactionSchema> => item !== null && item !== undefined)

    console.log(`Processed ${mappedData.length} rows for ${importType}`)
    return mappedData
  }

  // Flagging functions
  const flagHighValue = (row: z.infer<typeof transactionSchema>, thresholds: Thresholds): RawFlag[] => {
    if (row.amount > thresholds.high_value) {
      return [{
        flag: 'high_value',
        susp_code: 'SC3',
        reason: `High value: ${row.amount.toFixed(2)} > ${thresholds.high_value}`,
        'A/C#': row.acNum,
        'NAME OF CUSTOMERS': row.name,
        Type: row.type,
        AMOUNT: row.amount,
        DATE: row.date,
        'BANK CODE': row.bankCode,
      }]
    }
    return []
  }

  const flagLargeCashDeposit = (row: z.infer<typeof transactionSchema>, thresholds: Thresholds): RawFlag[] => {
    if (row.type === 'Deposit' && row.isCash && row.amount > thresholds.cash_deposit) {
      return [{
        flag: 'cash_deposit',
        susp_code: 'SC4',
        reason: `Large cash deposit: ${row.amount.toFixed(2)} > ${thresholds.cash_deposit}`,
        'A/C#': row.acNum,
        'NAME OF CUSTOMERS': row.name,
        Type: row.type,
        AMOUNT: row.amount,
        DATE: row.date,
        'BANK CODE': row.bankCode,
      }]
    }
    return []
  }

  const flagQuickWithdraw = (df: z.infer<typeof transactionSchema>[], thresholds: Thresholds): RawFlag[] => {
    if (!df.length) return []
    const sortedDf = [...df].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const deposits = sortedDf.filter(row => row.type === 'Deposit')
    const withdrawals = sortedDf.filter(row => row.type === 'Withdrawal')
    const flags: RawFlag[] = []
    deposits.forEach(dep => {
      const depDate = new Date(dep.date)
      withdrawals.forEach(wd => {
        const wdDate = new Date(wd.date)
        if (
          differenceInDays(wdDate, depDate) <= thresholds.time_period_days &&
          wd.amount > (dep.amount * thresholds.quick_withdraw_pct / 100)
        ) {
          flags.push({
            flag: 'quick_withdraw',
            susp_code: 'SC1',
            reason: `Quick withdraw ${wd.amount.toFixed(2)} after deposit ${dep.amount.toFixed(2)}`,
            'A/C#': wd.acNum,
            'NAME OF CUSTOMERS': wd.name,
            Type: wd.type,
            AMOUNT: wd.amount,
            DATE: wd.date,
            'BANK CODE': wd.bankCode,
          })
        }
      })
    })
    return flags
  }

  const flagCustomerCashTotal = (df: z.infer<typeof transactionSchema>[], thresholds: Thresholds): RawFlag[] => {
    if (!df.length) return []
    const cashDeps = df.filter(row => row.type === 'Deposit' && row.isCash)
    const total = cashDeps.reduce((sum, row) => sum + row.amount, 0)
    if (total > thresholds.customer_cash_total) {
      return [{
        flag: 'customer_cash_total',
        susp_code: 'PC1',
        reason: `Total cash deposits: ${total.toFixed(2)} > ${thresholds.customer_cash_total}`,
        'A/C#': cashDeps[0]?.acNum || '',
        'NAME OF CUSTOMERS': cashDeps[0]?.name || '',
        Type: 'Deposit',
        AMOUNT: total,
        DATE: df[df.length - 1]?.date || new Date().toISOString().split('T')[0],
        'BANK CODE': 'Multiple',
      }]
    }
    return []
  }

  const flagMultipleDepositsSources = (df: z.infer<typeof transactionSchema>[], thresholds: Thresholds): RawFlag[] => {
    if (!df.length) return []
    const maxDate = new Date(df.reduce((max, row) => Math.max(new Date(row.date).getTime(), new Date(max).getTime()), 0))
    const recentDeps = df.filter(row => row.type === 'Deposit' && differenceInDays(maxDate, new Date(row.date)) <= thresholds.time_period_days)
    const uniqueBanks = new Set(recentDeps.map(row => row.bankCode)).size
    const totalAmount = recentDeps.reduce((sum, row) => sum + row.amount, 0)
    if (uniqueBanks >= thresholds.num_deposits && totalAmount > thresholds.multiple_deposits_total) {
      return [{
        flag: 'multiple_deposits',
        susp_code: 'SC4',
        reason: `Multiple deposits from ${uniqueBanks} sources, total ${totalAmount.toFixed(2)}`,
        'A/C#': recentDeps[0]?.acNum || '',
        'NAME OF CUSTOMERS': recentDeps[0]?.name || '',
        Type: 'Deposit',
        AMOUNT: totalAmount,
        DATE: maxDate.toISOString().split('T')[0],
        'BANK CODE': 'Multiple',
      }]
    }
    return []
  }

  const flagDepositHighRisk = (row: z.infer<typeof transactionSchema>, thresholds: Thresholds): RawFlag[] => {
    if (row.type === 'Deposit' && HIGH_RISK_COUNTRIES.includes(row.country) && row.amount > thresholds.high_value) {
      return [{
        flag: 'deposit_high_risk',
        susp_code: 'SC1',
        reason: `Deposit from high-risk jurisdiction ${row.country} > ${thresholds.high_value}`,
        'A/C#': row.acNum,
        'NAME OF CUSTOMERS': row.name,
        Type: row.type,
        AMOUNT: row.amount,
        DATE: row.date,
        'BANK CODE': row.bankCode,
      }]
    }
    return []
  }

  const flagFlaggedAccount = (row: z.infer<typeof transactionSchema>, thresholds: Thresholds): RawFlag[] => {
    if (row.isFlagged && row.amount > thresholds.high_value) {
      return [{
        flag: 'flagged_account',
        susp_code: 'SC1',
        reason: `Flagged account (${row.flagReason}) transacted > ${thresholds.high_value}`,
        'A/C#': row.acNum,
        'NAME OF CUSTOMERS': row.name,
        Type: row.type,
        AMOUNT: row.amount,
        DATE: row.date,
        'BANK CODE': row.bankCode,
      }]
    }
    return []
  }

  const flagTotalValueOverTime = (df: z.infer<typeof transactionSchema>[], thresholds: Thresholds): RawFlag[] => {
    if (!df.length) return []
    const maxDate = new Date(df.reduce((max, row) => Math.max(new Date(row.date).getTime(), new Date(max).getTime()), 0))
    const recentDf = df.filter(row => differenceInDays(maxDate, new Date(row.date)) <= thresholds.time_period_days)
    const flags: RawFlag[] = []
    const types = [...new Set(recentDf.map(row => row.type))]
    types.forEach(transType => {
      const typeTotal = recentDf.filter(row => row.type === transType).reduce((sum, row) => sum + row.amount, 0)
      if (typeTotal > thresholds.high_value) {
        flags.push({
          flag: 'total_value_over_time',
          susp_code: 'SC3',
          reason: `Total ${transType} value ${typeTotal.toFixed(2)} > ${thresholds.high_value} in ${thresholds.time_period_days} days`,
          'A/C#': recentDf[0]?.acNum || '',
          'NAME OF CUSTOMERS': recentDf[0]?.name || '',
          Type: transType,
          AMOUNT: typeTotal,
          DATE: maxDate.toISOString().split('T')[0],
          'BANK CODE': 'Multiple',
        })
      }
    })
    return flags
  }

  const flagInactivityDeposit = (df: z.infer<typeof transactionSchema>[], thresholds: Thresholds): RawFlag[] => {
    if (!df.length) return []
    const sortedDf = [...df].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const flags: RawFlag[] = []
    sortedDf.forEach((row, idx) => {
      const prevDate = idx > 0 ? new Date(sortedDf[idx - 1].date) : null
      const daysSinceLast = prevDate ? differenceInDays(new Date(row.date), prevDate) : 0
      if (daysSinceLast > thresholds.inactivity_days && row.type === 'Deposit' && row.amount >= thresholds.high_value) {
        flags.push({
          flag: 'inactivity_deposit',
          susp_code: 'SC5',
          reason: `Deposit ${row.amount.toFixed(2)} >= ${thresholds.high_value} after ${daysSinceLast} days inactivity`,
          'A/C#': row.acNum,
          'NAME OF CUSTOMERS': row.name,
          Type: row.type,
          AMOUNT: row.amount,
          DATE: row.date,
          'BANK CODE': row.bankCode,
        })
      }
    })
    return flags
  }

  const flagPositionEmployment = (df: z.infer<typeof transactionSchema>[], thresholds: Thresholds): RawFlag[] => {
    if (!df.length || !df.some(row => row.employmentStatus)) return []
    const totalPosition = df.reduce((sum, row) => sum + row.amount, 0)
    const employment = df.find(row => row.employmentStatus)?.employmentStatus || 'unknown'
    if (totalPosition > thresholds.position_threshold && ['unemployed', 'student'].includes(employment)) {
      return [{
        flag: 'position_employment',
        susp_code: 'SC3',
        reason: `Total position ${totalPosition.toFixed(2)} > ${thresholds.position_threshold} with employment ${employment}`,
        'A/C#': df[0]?.acNum || '',
        'NAME OF CUSTOMERS': df[0]?.name || '',
        Type: 'Group',
        AMOUNT: totalPosition,
        DATE: df[df.length - 1]?.date || new Date().toISOString().split('T')[0],
        'BANK CODE': 'Multiple',
      }]
    }
    return []
  }

  const flagUndeployedCash = (df: z.infer<typeof transactionSchema>[], thresholds: Thresholds): RawFlag[] => {
    if (!df.length) return []
    const maxDate = new Date(df.reduce((max, row) => Math.max(new Date(row.date).getTime(), new Date(max).getTime()), 0))
    const recentDf = df.filter(row => differenceInDays(maxDate, new Date(row.date)) <= thresholds.time_period_days)
    if (recentDf.length && recentDf.every(row => row.type !== 'Withdrawal')) {
      const avgBalance = recentDf.reduce((sum, row) => sum + row.balance, 0) / recentDf.length
      if (avgBalance >= thresholds.undeployed_cash) {
        return [{
          flag: 'undeployed_cash',
          susp_code: 'SC1',
          reason: `Undeployed cash ${avgBalance.toFixed(2)} >= ${thresholds.undeployed_cash} over ${thresholds.time_period_days} days (no withdrawals)`,
          'A/C#': recentDf[0]?.acNum || '',
          'NAME OF CUSTOMERS': recentDf[0]?.name || '',
          Type: 'Group',
          AMOUNT: avgBalance,
          DATE: maxDate.toISOString().split('T')[0],
          'BANK CODE': 'Multiple',
        }]
      }
    }
    return []
  }

  const flagContactChanges = (df: z.infer<typeof transactionSchema>[], thresholds: Thresholds): RawFlag[] => {
    if (!df.length) return []
    const allChanges: Date[] = []
    df.forEach(row => {
      if (row.contactChanges) {
        const changes = row.contactChanges.split(',').map(c => parseISO(c.trim())).filter(d => !isNaN(d.getTime()))
        allChanges.push(...changes)
      }
    })
    if (!allChanges.length) return []
    const maxDate = new Date(df.reduce((max, row) => Math.max(new Date(row.date).getTime(), new Date(max).getTime()), 0))
    const recentChanges = allChanges.filter(d => differenceInDays(maxDate, d) <= thresholds.time_period_days)
    if (recentChanges.length >= thresholds.num_contact_changes) {
      return [{
        flag: 'contact_changes',
        susp_code: 'SC5',
        reason: `${recentChanges.length} critical contact changes in ${thresholds.time_period_days} days >= ${thresholds.num_contact_changes}`,
        'A/C#': df[0]?.acNum || '',
        'NAME OF CUSTOMERS': df[0]?.name || '',
        Type: 'Group',
        AMOUNT: 0,
        DATE: maxDate.toISOString().split('T')[0],
        'BANK CODE': 'Multiple',
      }]
    }
    return []
  }

  const flagSameEmailDifferentNames = (df: z.infer<typeof transactionSchema>[]): RawFlag[] => {
    if (!df.length) return []
    const filteredDf = df.filter(row => row.email && row.email !== '')
    if (!filteredDf.length) return []
    const emailGroups = new Map<string, Set<string>>()
    filteredDf.forEach(row => {
      if (row.email && row.name) {
        if (!emailGroups.has(row.email)) {
          emailGroups.set(row.email, new Set())
        }
        emailGroups.get(row.email)!.add(row.name)
      }
    })
    const flags: RawFlag[] = []
    emailGroups.forEach((names, email) => {
      if (names.size > 1) {
        const emailDf = filteredDf.filter(row => row.email === email)
        const uniqueAccounts = new Set(emailDf.map(row => row.acNum))
        uniqueAccounts.forEach(acc => {
          const accDf = emailDf.filter(row => row.acNum === acc)
          const name = accDf[0]?.name || 'Unknown'
          flags.push({
            flag: 'same_email_different_names',
            susp_code: 'SC2',
            reason: `Email ${email} used by multiple names: ${[...names].join(', ')}`,
            'A/C#': acc,
            'NAME OF CUSTOMERS': name,
            Type: 'Group',
            AMOUNT: 0,
            DATE: emailDf[emailDf.length - 1]?.date || new Date().toISOString().split('T')[0],
            'BANK CODE': 'Multiple',
          })
        })
      }
    })
    return flags
  }

  // Generate flags
  const generateFlags = (transactions: z.infer<typeof transactionSchema>[]): z.infer<typeof flagsSchema>[] => {
    const flags: z.infer<typeof flagsSchema>[] = []
    let flagId = 1

    const accountGroups = new Map<string, z.infer<typeof transactionSchema>[]>()
    transactions.forEach(tx => {
      if (tx.acNum) {
        if (!accountGroups.has(tx.acNum)) {
          accountGroups.set(tx.acNum, [])
        }
        accountGroups.get(tx.acNum)!.push(tx)
      }
    })

    transactions.forEach(tx => {
      const rowFlags = [
        ...flagHighValue(tx, thresholds),
        ...flagLargeCashDeposit(tx, thresholds),
        ...flagDepositHighRisk(tx, thresholds),
        ...flagFlaggedAccount(tx, thresholds),
      ]
      rowFlags.forEach(rawFlag => {
        flags.push({
          id: flagId++,
          transactionId: tx.id,
          flag: rawFlag.flag,
          suspCode: rawFlag.susp_code,
          reason: rawFlag.reason,
          score: flagScores[rawFlag.flag] || 1,
          suspCodeDesc: SUSP_CODE_DESCRIPTIONS[rawFlag.susp_code] || '',
          acNum: rawFlag['A/C#'] || tx.acNum,
          name: rawFlag['NAME OF CUSTOMERS'] || tx.name,
          type: rawFlag.Type || tx.type,
          amount: rawFlag.AMOUNT || tx.amount,
          date: rawFlag.DATE || tx.date,
          bankCode: rawFlag['BANK CODE'] || tx.bankCode,
          country: tx.country,
          notes: '',
        })
      })
    })

    accountGroups.forEach((accountTxs, acNum) => {
      const groupFlags = [
        ...flagQuickWithdraw(accountTxs, thresholds),
        ...flagCustomerCashTotal(accountTxs, thresholds),
        ...flagMultipleDepositsSources(accountTxs, thresholds),
        ...flagTotalValueOverTime(accountTxs, thresholds),
        ...flagInactivityDeposit(accountTxs, thresholds),
        ...flagPositionEmployment(accountTxs, thresholds),
        ...flagUndeployedCash(accountTxs, thresholds),
        ...flagContactChanges(accountTxs, thresholds),
        ...flagSameEmailDifferentNames(accountTxs),
      ]
      groupFlags.forEach(rawFlag => {
        const refTx = accountTxs[0] || { id: 0, acNum: '', name: '', type: '', amount: 0, date: new Date().toISOString().split('T')[0], bankCode: '', country: '' }
        flags.push({
          id: flagId++,
          transactionId: refTx.id,
          flag: rawFlag.flag,
          suspCode: rawFlag.susp_code,
          reason: rawFlag.reason,
          score: flagScores[rawFlag.flag] || 1,
          suspCodeDesc: SUSP_CODE_DESCRIPTIONS[rawFlag.susp_code] || '',
          acNum: rawFlag['A/C#'] || refTx.acNum,
          name: rawFlag['NAME OF CUSTOMERS'] || refTx.name,
          type: rawFlag.Type || refTx.type,
          amount: rawFlag.AMOUNT || refTx.amount,
          date: rawFlag.DATE || refTx.date,
          bankCode: rawFlag['BANK CODE'] || refTx.bankCode,
          country: refTx.country,
          notes: '',
        })
      })
    })

    console.log(`Generated ${flags.length} flags:`, flags)
    return flags
  }

  // Update flags when transactionData, thresholds, or scores change
  useEffect(() => {
    const newFlags = generateFlags(transactionData)
    setFlagsData(newFlags)
  }, [transactionData, thresholds, flagScores])

  const transactionDataIds = useMemo<UniqueIdentifier[]>(
    () => transactionData.filter(item => item !== null && item !== undefined && typeof item.id === 'number').map(({ id }) => id),
    [transactionData]
  )

  const flagsDataIds = useMemo<UniqueIdentifier[]>(
    () => flagsData.filter(item => item !== null && item !== undefined && typeof item.id === 'number').map(({ id }) => id),
    [flagsData]
  )

  const transactionTable = useReactTable({
    data: transactionData,
    columns: transactionColumns,
    state: {
      sorting,
      columnVisibility: transactionColumnVisibility,
      rowSelection,
      columnFilters: transactionFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setTransactionFilters,
    onColumnVisibilityChange: setTransactionColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const flagsTable = useReactTable({
    data: flagsData,
    columns: flagsColumns,
    state: {
      sorting,
      columnVisibility: flagsColumnVisibility,
      rowSelection,
      columnFilters: flagsFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setFlagsFilters,
    onColumnVisibilityChange: setFlagsColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      onEditNote: (flagId: number, currentNote: string) => {
        setCurrentFlagId(flagId)
        setNoteText(currentNote)
        setIsNoteDialogOpen(true)
      },
    },
  })

  const handleDragEnd = (
    event: DragEndEvent,
    table: typeof transactionTable | typeof flagsTable,
    dataIds: UniqueIdentifier[],
    setData: React.Dispatch<React.SetStateAction<z.infer<typeof transactionSchema>[] | z.infer<typeof flagsSchema>[]>>,
  ) => {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !importType) {
      console.log(`No file or importType: file=${file?.name}, importType=${importType}`)
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        let jsonData: (string | number | Date | undefined)[][]
        if (file.name.endsWith('.csv')) {
          const text = new TextDecoder().decode(data)
          const delimiters = [',', ';', '\t']
          let parsed = false
          for (const delimiter of delimiters) {
            try {
              const sheet = XLSX.utils.csv_to_sheet(text, { FS: delimiter })
              jsonData = XLSX.utils.sheet_to_json<(string | number | Date | undefined)[]>(sheet, { header: 1, blankrows: false })
              if (jsonData.length > 0 && jsonData[0].length > 1) {
                console.log(`Parsed CSV data from ${file.name} with delimiter '${delimiter}' (${jsonData.length} rows, ${jsonData[0].length} columns):`, jsonData)
                parsed = true
                break
              }
            } catch (error) {
              console.log(`Failed to parse CSV with delimiter '${delimiter}':`, error)
            }
          }
          if (!parsed) {
            console.error(`Failed to parse CSV ${file.name} with any delimiter`)
            toast.error(`Failed to parse CSV ${file.name}`)
            return
          }
        } else {
          const workbook = XLSX.read(data, { type: 'array', cellDates: true, blankrows: false })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          jsonData = XLSX.utils.sheet_to_json<(string | number | Date | undefined)[]>(sheet, { header: 1, blankrows: false })
          console.log(`Parsed Excel data from ${file.name} (${jsonData.length} rows, ${jsonData[0]?.length || 0} columns):`, jsonData)
        }

        const processedData = processSheet(jsonData, importType)
        if (processedData.length === 0) {
          console.log(`No valid data after processing ${file.name}`)
          toast.error(`No valid data found in ${file.name}`)
          return
        }

        setTransactionData((prev) => {
          const newData = [...prev, ...processedData]
          console.log(`Updated transactionData with ${processedData.length} new rows:`, newData)
          setAuditLog(prev => [
            ...prev,
            {
              timestamp: new Date().toISOString(),
              userId: whitelistForm.addedBy || "unknown",
              action: "import_transactions",
              details: { filename: file.name, importType, count: processedData.length },
            },
          ])
          return newData
        })
        toast.success(`Imported ${processedData.length} ${importType} transactions from ${file.name}`)
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error(`Import error for ${file.name}:`, error)
      toast.error(`Failed to import ${file.name}`)
    } finally {
      setImportType(null)
      e.target.value = ""
    }
  }

  const handleImportTypeSelect = (type: "Deposit" | "Withdrawal" | "Buy/Sell") => {
    setImportType(type)
    fileRef.current?.click()
  }

  const handleThresholdChange = (newThresholds: Partial<Thresholds>) => {
    setThresholds(prev => ({ ...prev, ...newThresholds }))
    setAuditLog(prev => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        userId: whitelistForm.addedBy || "unknown",
        action: "update_thresholds",
        details: newThresholds,
      },
    ])
  }

  const handleFlagScoresChange = (newScores: Partial<FlagScores>) => {
    setFlagScores(prev => ({ ...prev, ...newScores }))
    setAuditLog(prev => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        userId: whitelistForm.addedBy || "unknown",
        action: "update_flag_scores",
        details: newScores,
      },
    ])
  }

  const handleEditNote = (flagId: number, note: string) => {
    setFlagsData(prev =>
      prev.map(flag =>
        flag.id === flagId ? { ...flag, notes: note } : flag
      )
    )
    setAuditLog(prev => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        userId: whitelistForm.addedBy || "unknown",
        action: "edit_note",
        details: { flagId, note },
      },
    ])
    setIsNoteDialogOpen(false)
    setCurrentFlagId(null)
    setNoteText("")
    toast.success("Note updated successfully")
  }

  const handleAddToWhitelist = () => {
    const selectedRows = transactionTable.getSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error("No transactions selected")
      return
    }
    setIsWhitelistDialogOpen(true)
  }

  const handleWhitelistSubmit = () => {
    const selectedRows = transactionTable.getSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error("No transactions selected")
      return
    }
    const newWhitelistItems = selectedRows.map(row => ({
      id: whitelistData.length + 1,
      acNum: row.original.acNum,
      name: row.original.name,
      reason: whitelistForm.reason,
      dateAdded: new Date().toISOString().split('T')[0],
      addedBy: whitelistForm.addedBy,
    }))
    try {
      const validatedItems = newWhitelistItems.map(item => whitelistSchema.parse(item))
      setWhitelistData(prev => [...prev, ...validatedItems])
      setAuditLog(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          userId: whitelistForm.addedBy || "unknown",
          action: "add_to_whitelist",
          details: { items: validatedItems.map(item => ({ acNum: item.acNum, name: item.name, reason: item.reason })) },
        },
      ])
      setRowSelection({})
      setIsWhitelistDialogOpen(false)
      setWhitelistForm({ reason: "", addedBy: "" })
      toast.success(`Added ${validatedItems.length} transactions to whitelist`)
    } catch (error) {
      console.error("Invalid whitelist data:", error)
      toast.error("Failed to add to whitelist")
    }
  }

  const handleExport = () => {
    if (flagsData.length === 0) {
      toast.error("No flagged transactions to export")
      return
    }

    try {
      const exportData = flagsData.map(flag => ({
        ID: flag.id,
        "Transaction ID": flag.transactionId,
        Flag: flag.flag,
        "Susp. Code": flag.suspCode,
        Reason: flag.reason,
        Score: flag.score,
        "Susp. Code Desc.": flag.suspCodeDesc,
        "A/C#": flag.acNum,
        Name: flag.name,
        Type: flag.type,
        Amount: flag.amount,
        Date: flag.date,
        "Bank Code": flag.bankCode,
        Country: flag.country,
        Notes: flag.notes,
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Flagged Transactions")
      const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss")
      const filename = `flagged_transactions_${timestamp}.xlsx`
      XLSX.writeFile(workbook, filename)

      setAuditLog(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          userId: whitelistForm.addedBy || "unknown",
          action: "export_flags",
          details: { filename, count: flagsData.length },
        },
      ])
      toast.success(`Exported ${flagsData.length} flagged transactions to ${filename}`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export flagged transactions")
    }
  }

  return (
    <Tabs
      defaultValue="raw"
      className="w-full flex-col justify-start gap-6"
      onValueChange={(value) => setPagination({ pageIndex: 0, pageSize: 10 })}
    >
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="raw">Raw</TabsTrigger>
          <TabsTrigger value="filtered">Filtered</TabsTrigger>
        </TabsList>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TabsContent value="raw" className="m-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Filter by name or email..."
                  value={(transactionTable.getColumn("name")?.getFilterValue() as string) ?? ""}
                  onChange={(event) => {
                    const value = event.target.value
                    transactionTable.getColumn("name")?.setFilterValue(value)
                    transactionTable.getColumn("email")?.setFilterValue(value)
                  }}
                  className="max-w-sm"
                  aria-label="Filter transactions by name or email"
                />
                <Button
                  className="w-[140px] h-8"
                  variant="outline"
                  size="sm"
                  onClick={handleAddToWhitelist}
                  disabled={Object.keys(rowSelection).length === 0}
                >
                  Add to Whitelist
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="filtered" className="m-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Filter by name or flag..."
                  value={(flagsTable.getColumn("name")?.getFilterValue() as string) ?? ""}
                  onChange={(event) => {
                    const value = event.target.value
                    flagsTable.getColumn("name")?.setFilterValue(value)
                    flagsTable.getColumn("flag")?.setFilterValue(value)
                  }}
                  className="max-w-sm"
                  aria-label="Filter flags by name or flag type"
                />
                <SetThresh onThresholdChange={handleThresholdChange} />
                <SetFlags onFlagScoresChange={handleFlagScoresChange} />
              </div>
            </TabsContent>
          </div>
          <div className="flex items-center gap-2">
            <TabsContent value="raw" className="m-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <IconPlus className="mr-2 h-4 w-4" />
                    <span className="hidden lg:inline">Import</span>
                    <IconChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleImportTypeSelect("Deposit")}>
                    Deposit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleImportTypeSelect("Withdrawal")}>
                    Withdrawal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleImportTypeSelect("Buy/Sell")}>
                    Buy/Sell
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                type="file"
                ref={fileRef}
                onChange={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
            </TabsContent>
            <TabsContent value="filtered" className="m-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <IconPlus className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </TabsContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns className="mr-2 h-4 w-4" />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {(transactionTable.getState().pagination.pageIndex === 0 ? transactionTable : flagsTable)
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" && column.getCanHide()
                  )
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <TabsContent
        value="raw"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-x-auto rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={(event) => handleDragEnd(event, transactionTable, transactionDataIds, setTransactionData)}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {transactionTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan} className="py-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {transactionTable.getRowModel().rows?.length ? (
                  <SortableContext
                    items={transactionDataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {transactionTable.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="relative z-0 hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={transactionColumns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {transactionTable.getFilteredSelectedRowModel().rows.length} of{" "}
            {transactionTable.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${transactionTable.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  transactionTable.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={transactionTable.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {transactionTable.getState().pagination.pageIndex + 1} of{" "}
              {transactionTable.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => transactionTable.setPageIndex(0)}
                disabled={!transactionTable.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => transactionTable.previousPage()}
                disabled={!transactionTable.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => transactionTable.nextPage()}
                disabled={!transactionTable.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => transactionTable.setPageIndex(transactionTable.getPageCount() - 1)}
                disabled={!transactionTable.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="filtered"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-x-auto rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={(event) => handleDragEnd(event, flagsTable, flagsDataIds, setFlagsData)}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {flagsTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan} className="py-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {flagsTable.getRowModel().rows?.length ? (
                  <SortableContext
                    items={flagsDataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {flagsTable.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="relative z-0 hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={flagsColumns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {flagsTable.getFilteredSelectedRowModel().rows.length} of{" "}
            {flagsTable.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${flagsTable.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  flagsTable.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={flagsTable.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {flagsTable.getState().pagination.pageIndex + 1} of{" "}
              {flagsTable.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => flagsTable.setPageIndex(0)}
                disabled={!flagsTable.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => flagsTable.previousPage()}
                disabled={!flagsTable.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => flagsTable.nextPage()}
                disabled={!flagsTable.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => flagsTable.setPageIndex(flagsTable.getPageCount() - 1)}
                disabled={!flagsTable.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Note Edit Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter note"
            />
            <Button
              onClick={() => currentFlagId && handleEditNote(currentFlagId, noteText)}
              disabled={!noteText.trim()}
            >
              Save Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Whitelist Dialog */}
      <Dialog open={isWhitelistDialogOpen} onOpenChange={setIsWhitelistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Whitelist</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="col-span-2">Reason</Label>
              <Input
                id="reason"
                value={whitelistForm.reason}
                onChange={(e) => setWhitelistForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason for whitelisting"
                className="col-span-2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="addedBy" className="col-span-2">Added By</Label>
              <Input
                id="addedBy"
                value={whitelistForm.addedBy}
                onChange={(e) => setWhitelistForm(prev => ({ ...prev, addedBy: e.target.value }))}
                placeholder="User ID"
                className="col-span-2"
              />
            </div>
            <Button
              onClick={handleWhitelistSubmit}
              disabled={!whitelistForm.reason.trim() || !whitelistForm.addedBy.trim()}
            >
              Add to Whitelist
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}