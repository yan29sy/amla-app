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
import { CSS } from "@dnd-kit/utilities"
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
import { useRef, useState } from "react"
import * as XLSX from "xlsx"
import { useId } from "react"

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
import { SetThresh } from "@/components/set-thresh"
import { SetFlags } from "@/components/set-flags"
import { transactionColumns, flagsColumns } from "@/components/table-columns"

// Mock data for flags (temporary, to be replaced later)
const flagsData: z.infer<typeof flagsSchema>[] = [
  {
    id: 1,
    transactionId: 2,
    flag: "high_value",
    suspCode: "SC3",
    reason: "High value: 750000 > 500000",
    score: 1,
    suspCodeDesc: "Amount not commensurate with client capacity",
    acNum: "ACC0002",
    name: "Jane Smith",
    type: "Withdrawal",
    amount: 750000,
    date: "2025-07-02",
    bankCode: "BANK001",
    country: "USA",
    notes: "Reviewed, no further action needed",
  },
  {
    id: 2,
    transactionId: 2,
    flag: "flagged_account",
    suspCode: "SC1",
    reason: "Flagged account (High Risk) transacted > 500000",
    score: 3,
    suspCodeDesc: "No underlying legal or trade obligation",
    acNum: "ACC0002",
    name: "Jane Smith",
    type: "Withdrawal",
    amount: 750000,
    date: "2025-07-02",
    bankCode: "BANK001",
    country: "USA",
    notes: "",
  },
]

// Interfaces for Excel row data
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
  'SCCP FEE/PDC FEE'?: number;
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

export function DataTable({
  transactions: initialTransactionData = [],
  flags: initialFlagsData = flagsData,
}: {
  transactions?: z.infer<typeof transactionSchema>[]
  flags?: z.infer<typeof flagsSchema>[]
}) {
  const [transactionData, setTransactionData] = useState<z.infer<typeof transactionSchema>[]>(initialTransactionData)
  const [flagsData, setFlagsData] = useState<z.infer<typeof flagsSchema>[]>(initialFlagsData)
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
  })
  const [flagsColumnVisibility, setFlagsColumnVisibility] = useState<VisibilityState>({
    reason: false,
    suspCodeDesc: false,
    notes: false,
  })
  const [transactionFilters, setTransactionFilters] = useState<ColumnFiltersState>([])
  const [flagsFilters, setFlagsFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [importType, setImportType] = useState<"Deposit" | "Withdrawal" | "Buy/Sell" | null>(null)
  const sortableId = useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )
  const fileRef = useRef<HTMLInputElement | null>(null)

  const transactionDataIds = React.useMemo<UniqueIdentifier[]>(
    () => transactionData.map(({ id }) => id),
    [transactionData]
  )

  const flagsDataIds = React.useMemo<UniqueIdentifier[]>(
    () => flagsData.map(({ id }) => id),
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
  })

  function handleDragEnd(
    event: DragEndEvent,
    table: typeof transactionTable | typeof flagsTable,
    dataIds: UniqueIdentifier[],
    setData: React.Dispatch<React.SetStateAction<z.infer<typeof transactionSchema>[] | z.infer<typeof flagsSchema>[]>>,
  ) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  // Process Excel/CSV file to mimic Python converter logic
  const processSheet = (data: (string | number | Date | undefined)[][], importType: "Deposit" | "Withdrawal" | "Buy/Sell"): z.infer<typeof transactionSchema>[] => {
    // Headers for Buy/Sell (raw_buying.csv, raw_selling.csv)
    const buySellHeaders = [
      'DATE', 'CONF NO.', 'CUSTOMER CODE', 'CUSTOMER NAME', 'A/E', 'STOCK CODE',
      'NO. OF SHARES', 'UNIT PRICE', 'CLEARING ACCOUNT', 'COMM.', 'VAT PAYABLE',
      'DST', 'TRANSFER FEE', 'VAT WTAX', 'PSE FEE', 'SCCP FEE/PDC FEE',
      'CUSTOMER ACCOUNT', 'USER', 'STAT'
    ] as const
    // Headers for Deposit/Withdrawal (raw_deposit.csv)
    const depositHeaders = [
      'DATE', 'O.R. NO.', 'A/C#', 'NAME OF CUSTOMERS', 'AMOUNT', 'BANK CODE',
      'CHECK NO.', 'CHECK DATE', 'USER ID', 'STAT'
    ] as const
    // Column indices for Buy/Sell (0-based: A, B, C, F, G, I, L, N, Q, T, W, Z, AB, AD, AE, AH, AJ, AM, AP)
    const buySellColumnIndices = [0, 1, 2, 5, 6, 8, 11, 13, 16, 19, 22, 25, 27, 29, 30, 33, 35, 38, 41]
    // Column indices for Deposit/Withdrawal (0-based: A, D, I, K, T, X, AB, AD, AF, AH)
    const depositColumnIndices = [0, 3, 8, 10, 19, 23, 27, 29, 31, 33]
    const minColumns = importType === "Buy/Sell" ? 19 : 10
    const minNonEmpty = importType === "Buy/Sell" ? 5 : 2

    // Log input data
    console.log(`Processing ${data.length} rows for ${importType}`)

    // Warn if column count is lower than expected, but proceed
    if (data.length > 0 && data[0].length < minColumns) {
      console.warn(`File has ${data[0].length} columns, expected at least ${minColumns}. Attempting to process.`)
      toast.warning(`File has ${data[0].length} columns, expected at least ${minColumns}`)
    }

    // Select headers and indices based on importType
    const headers = importType === "Buy/Sell" ? buySellHeaders : depositHeaders
    const columnIndices = importType === "Buy/Sell" ? buySellColumnIndices : depositColumnIndices

    // Process data
    let processedData: (BuySellRow | DepositRow)[] = data
      .slice(importType === "Buy/Sell" ? 15 : 13)
      .map((row, rowIndex) => {
        // Select columns, use empty string for undefined values
        const selectedRow = columnIndices.map(index => row[index] !== undefined ? row[index] : '')
        const obj: { [key: string]: string | number | Date | undefined } = {}
        headers.forEach((header, i) => {
          obj[header] = selectedRow[i]
        })
        console.log(`Row ${rowIndex + 1} after column selection:`, obj)
        return obj as BuySellRow | DepositRow
      })
      .filter((row, rowIndex) => {
        // Remove rows with invalid content
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
        // Remove rows with insufficient non-empty values
        const nonEmptyCount = Object.values(row).filter(val => val !== '' && val != null && val !== undefined).length
        if (nonEmptyCount < minNonEmpty) {
          console.log(`Row ${rowIndex + 1} filtered out: only ${nonEmptyCount} non-empty values`)
          return false
        }
        return true
      })

    // Handle Buy/Sell-specific logic (skip "Buying"/"Selling" rows, forward fill)
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
        // Forward fill CONF NO. and CUSTOMER CODE
        row['CONF NO.'] = row['CONF NO.'] || lastConfNo
        row['CUSTOMER CODE'] = row['CUSTOMER CODE'] || lastCustomerCode
        lastConfNo = row['CONF NO.'] || lastConfNo
        lastCustomerCode = row['CUSTOMER CODE'] || lastCustomerCode
        console.log(`Row ${rowIndex + 1} after forward fill:`, row)
        return true
      })
    }

    // Forward fill DATE and convert to ISO string
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

    // Filter out rows with undefined DATE
    processedData = processedData.filter((row, rowIndex) => {
      if (row['DATE'] === undefined) {
        console.log(`Row ${rowIndex + 1} filtered out: undefined DATE`)
        return false
      }
      return true
    })

    // Map to transactionSchema
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
    }).filter((item): item is z.infer<typeof transactionSchema> => item !== null)

    console.log(`Processed ${mappedData.length} rows for ${importType}`)
    return mappedData
  }

  // Handle file select and import
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
          // Try multiple delimiters
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

  // Handle import type selection
  const handleImportTypeSelect = (type: "Deposit" | "Withdrawal" | "Buy/Sell") => {
    setImportType(type)
    fileRef.current?.click()
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
                  onClick={() => toast.info("Set to Whitelist")}
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
                <SetThresh />
                <SetFlags />
              </div>
            </TabsContent>
          </div>
          <div className="flex items-center gap-2">
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
                onClick={() => toast.info("Export triggered")}
              >
                <IconPlus className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </TabsContent>
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
            onDragEnd={(event) => handleDragEnd(event, flagsTable, transactionDataIds, setFlagsData)}
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
    </Tabs>
  )
}