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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
  IconLoader,
  IconSearch,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"
import { useRef } from "react"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { transactionSchema } from "@/types/transactions"
import { SetThresh } from "./set-thresh"
import { SetFlags } from "./set-flags"
import { Checkbox } from "./ui/checkbox"

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  date: z.string(),
  orNo: z.string(),
  acNum: z.string(),
  name: z.string(),
  amount: z.number(),
  bankCode: z.string(),
  country: z.string(),
  isCash: z.boolean(),
  checkNo: z.string(),
  checkDate: z.string(),
  userId: z.string(),
  stat: z.string(),
  type: z.string(),
  email: z.string(),
  employmentStatus: z.string(),
  isFlagged: z.boolean(),
  flagReason: z.string(),
  balance: z.number(),
  contactChanges: z.string(),
  mot: z.number(),
  purpose: z.string(),
  productType: z.string(),
  idType: z.string(),
  idNo: z.string(),
  sourceFund: z.string(),
  currencyCode: z.string(),
  cityCode: z.string(),
})

// Flags schema
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

// Mock data for transactions table (Raw tab)
const transactionData: z.infer<typeof transactionSchema>[] = [
  {
    id: 1,
    date: "2025-07-01",
    orNo: "CV000001",
    acNum: "ACC0001",
    name: "John Doe",
    amount: 500000,
    bankCode: "CASH",
    country: "PHL",
    isCash: true,
    checkNo: "",
    checkDate: "",
    userId: "MD",
    stat: "P",
    type: "Deposit",
    email: "john@example.com",
    employmentStatus: "employed",
    isFlagged: false,
    flagReason: "",
    balance: 1000000,
    contactChanges: "",
    mot: 1,
    purpose: "PR1",
    productType: "PT1",
    idType: "ID1",
    idNo: "123456",
    sourceFund: "SF1",
    currencyCode: "PHP",
    cityCode: "010000000",
  },
  {
    id: 2,
    date: "2025-07-02",
    orNo: "CV000002",
    acNum: "ACC0002",
    name: "Jane Smith",
    amount: 750000,
    bankCode: "BANK001",
    country: "USA",
    isCash: false,
    checkNo: "123456",
    checkDate: "2025-07-02",
    userId: "JL",
    stat: "C",
    type: "Withdrawal",
    email: "jane@example.com",
    employmentStatus: "unemployed",
    isFlagged: true,
    flagReason: "High Risk",
    balance: 200000,
    contactChanges: "2025-06-01,2025-06-15",
    mot: 2,
    purpose: "PR2",
    productType: "PT2",
    idType: "ID2",
    idNo: "789012",
    sourceFund: "SF2",
    currencyCode: "USD",
    cityCode: "020000000",
  },
  {
    id: 3,
    date: "2025-07-03",
    orNo: "CV000003",
    acNum: "ACC0003",
    name: "Alice Brown",
    amount: 250000,
    bankCode: "BANK002",
    country: "CHN",
    isCash: false,
    checkNo: "",
    checkDate: "",
    userId: "EBR",
    stat: "P",
    type: "Buy",
    email: "alice@example.com",
    employmentStatus: "student",
    isFlagged: false,
    flagReason: "",
    balance: 500000,
    contactChanges: "2025-05-20",
    mot: 3,
    purpose: "PR1",
    productType: "PT1",
    idType: "ID1",
    idNo: "456789",
    sourceFund: "SF1",
    currencyCode: "EUR",
    cityCode: "010000000",
  },
]

// Mock data for flags table (Filtered tab)
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

// Drag handle component
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// Columns for transactions table (Raw tab)
const transactionColumns: ColumnDef<z.infer<typeof transactionSchema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
    enableHiding: false,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="font-mono">{row.original.id}</div>,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <IconChevronDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <TransactionCellViewer item={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: "orNo",
    header: "O.R. No.",
    cell: ({ row }) => <div className="font-mono">{row.original.orNo}</div>,
  },
  {
    accessorKey: "acNum",
    header: "A/C#",
    cell: ({ row }) => <div className="font-mono">{row.original.acNum}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name of Customers
        <IconChevronDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.original.name}</div>,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amt = Number(row.original.amount)
      const formatted = isFinite(amt)
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: row.original.currencyCode || "USD",
          }).format(amt)
        : "0.00"
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "bankCode",
    header: "Bank Code",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-2 py-1">
          {row.original.bankCode}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "country",
    header: () => <div className="text-right">Country</div>,
    cell: ({ row }) => <div className="text-right">{row.original.country}</div>,
  },
  {
    accessorKey: "isCash",
    header: "Is Cash",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-2 py-1">
        {row.original.isCash ? "Yes" : "No"}
      </Badge>
    ),
  },
  {
    accessorKey: "checkNo",
    header: "Check No.",
    cell: ({ row }) => <div>{row.original.checkNo}</div>,
  },
  {
    accessorKey: "checkDate",
    header: "Check Date",
    cell: ({ row }) => (
      <div>
        {row.original.checkDate
          ? new Date(row.original.checkDate).toLocaleDateString()
          : ""}
      </div>
    ),
  },
  {
    accessorKey: "userId",
    header: "User ID",
    cell: ({ row }) => <div className="font-mono">{row.original.userId}</div>,
  },
  {
    accessorKey: "stat",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-2 py-1">
        {row.original.stat}
      </Badge>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        variant={row.original.type === "Deposit" ? "default" : "outline"}
        className="text-muted-foreground px-2 py-1"
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <IconChevronDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.original.email}</div>,
  },
  {
    accessorKey: "employmentStatus",
    header: "Employment Status",
    cell: ({ row }) => <div>{row.original.employmentStatus}</div>,
  },
  {
    accessorKey: "isFlagged",
    header: "Flagged",
    cell: ({ row }) => (
      <Badge
        variant={row.original.isFlagged ? "destructive" : "outline"}
        className="text-muted-foreground px-2 py-1"
      >
        {row.original.isFlagged ? (
          <IconCircleCheckFilled className="mr-1 h-4 w-4 fill-red-500 dark:fill-red-400" />
        ) : (
          <IconLoader className="mr-1 h-4 w-4" />
        )}
        {row.original.isFlagged ? "Flagged" : "Normal"}
      </Badge>
    ),
  },
  {
    accessorKey: "flagReason",
    header: "Flag Reason",
    cell: ({ row }) => <div>{row.original.flagReason}</div>,
  },
  {
    accessorKey: "balance",
    header: () => <div className="text-right">Balance</div>,
    cell: ({ row }) => {
      const bal = Number(row.original.balance)
      const formatted = isFinite(bal)
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: row.original.currencyCode || "USD",
          }).format(bal)
        : "0.00"
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "contactChanges",
    header: "Contact Changes",
    cell: ({ row }) => <div>{row.original.contactChanges}</div>,
  },
  {
    accessorKey: "mot",
    header: "MOT",
    cell: ({ row }) => <div>{row.original.mot}</div>,
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    cell: ({ row }) => <div>{row.original.purpose}</div>,
  },
  {
    accessorKey: "productType",
    header: "Product Type",
    cell: ({ row }) => <div>{row.original.productType}</div>,
  },
  {
    accessorKey: "idType",
    header: "ID Type",
    cell: ({ row }) => <div>{row.original.idType}</div>,
  },
  {
    accessorKey: "idNo",
    header: "ID No.",
    cell: ({ row }) => <div className="font-mono">{row.original.idNo}</div>,
  },
  {
    accessorKey: "sourceFund",
    header: "Source of Fund",
    cell: ({ row }) => <div>{row.original.sourceFund}</div>,
  },
  {
    accessorKey: "currencyCode",
    header: "Currency",
    cell: ({ row }) => <div>{row.original.currencyCode}</div>,
  },
  {
    accessorKey: "cityCode",
    header: "City Code",
    cell: ({ row }) => <div className="font-mono">{row.original.cityCode}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(row.original.id.toString())}
            aria-label={`Copy transaction ID ${row.original.id}`}
          >
            Copy Transaction ID
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(row.original.acNum)}
            aria-label={`Copy account number ${row.original.acNum}`}
          >
            Copy Account Number
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View Customer Details</DropdownMenuItem>
          <DropdownMenuItem>View Transaction Details</DropdownMenuItem>
          <DropdownMenuItem>Add Note</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

// Columns for flags table (Filtered tab)
const flagsColumns: ColumnDef<z.infer<typeof flagsSchema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
    enableHiding: false,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="font-mono">{row.original.id}</div>,
  },
  {
    accessorKey: "transactionId",
    header: "Transaction ID",
    cell: ({ row }) => <div className="font-mono">{row.original.transactionId}</div>,
  },
  {
    accessorKey: "flag",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Flag
        <IconChevronDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-2 py-1">
        {row.original.flag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
      </Badge>
    ),
  },
  {
    accessorKey: "suspCode",
    header: "Susp. Code",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-2 py-1">
        {row.original.suspCode}
      </Badge>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => <div>{row.original.reason}</div>,
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) => <div>{row.original.score}</div>,
  },
  {
    accessorKey: "suspCodeDesc",
    header: "Susp. Code Desc.",
    cell: ({ row }) => <div>{row.original.suspCodeDesc}</div>,
  },
  {
    accessorKey: "acNum",
    header: "A/C#",
    cell: ({ row }) => <div className="font-mono">{row.original.acNum}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <IconChevronDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.original.name}</div>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        variant={row.original.type === "Deposit" ? "default" : "outline"}
        className="text-muted-foreground px-2 py-1"
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amt = Number(row.original.amount)
      const formatted = isFinite(amt)
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD", // Flags table doesn't have currencyCode, default to USD
          }).format(amt)
        : "0.00"
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <IconChevronDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <FlagsCellViewer item={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: "bankCode",
    header: "Bank Code",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-2 py-1">
        {row.original.bankCode}
      </Badge>
    ),
  },
  {
    accessorKey: "country",
    header: () => <div className="text-right">Country</div>,
    cell: ({ row }) => <div className="text-right">{row.original.country}</div>,
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => <div>{row.original.notes}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(row.original.id.toString())}
            aria-label={`Copy flag ID ${row.original.id}`}
          >
            Copy Flag ID
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(row.original.transactionId.toString())}
            aria-label={`Copy transaction ID ${row.original.transactionId}`}
          >
            Copy Transaction ID
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(row.original.acNum)}
            aria-label={`Copy account number ${row.original.acNum}`}
          >
            Copy Account Number
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>View Customer Details</DropdownMenuItem>
          <DropdownMenuItem>View Flag Details</DropdownMenuItem>
          <DropdownMenuItem>Add Note</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

// Viewer for transactions table
function TransactionCellViewer({ item }: { item: z.infer<typeof transactionSchema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {new Date(item.date).toLocaleDateString()}
        </Button>
      </DrawerTrigger>
      <DrawerContent className={isMobile ? "h-[80vh]" : "w-[600px]"}>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>Transaction Details</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="id">ID</Label>
                <Input id="id" defaultValue={item.id} disabled aria-describedby="id-description" />
                <p id="id-description" className="sr-only">Transaction ID</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="date">Date</Label>
                <Input id="date" defaultValue={item.date} aria-describedby="date-description" />
                <p id="date-description" className="sr-only">Transaction date</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="orNo">O.R. No.</Label>
                <Input id="orNo" defaultValue={item.orNo} aria-describedby="orNo-description" />
                <p id="orNo-description" className="sr-only">Order receipt number</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="acNum">A/C#</Label>
                <Input id="acNum" defaultValue={item.acNum} aria-describedby="acNum-description" />
                <p id="acNum-description" className="sr-only">Account number</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Name of Customers</Label>
              <Input id="name" defaultValue={item.name} aria-describedby="name-description" />
              <p id="name-description" className="sr-only">Customer name</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" defaultValue={item.amount} type="number" aria-describedby="amount-description" />
                <p id="amount-description" className="sr-only">Transaction amount</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="balance">Balance</Label>
                <Input id="balance" defaultValue={item.balance} type="number" aria-describedby="balance-description" />
                <p id="balance-description" className="sr-only">Account balance</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="bankCode">Bank Code</Label>
                <Input id="bankCode" defaultValue={item.bankCode} aria-describedby="bankCode-description" />
                <p id="bankCode-description" className="sr-only">Bank code</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="country">Country</Label>
                <Input id="country" defaultValue={item.country} aria-describedby="country-description" />
                <p id="country-description" className="sr-only">Country code</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="isCash">Is Cash</Label>
                <Select defaultValue={item.isCash ? "Yes" : "No"} disabled>
                  <SelectTrigger id="isCash" aria-describedby="isCash-description">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
                <p id="isCash-description" className="sr-only">Whether the transaction is cash-based</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="checkNo">Check No.</Label>
                <Input id="checkNo" defaultValue={item.checkNo} aria-describedby="checkNo-description" />
                <p id="checkNo-description" className="sr-only">Check number</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="checkDate">Check Date</Label>
                <Input id="checkDate" defaultValue={item.checkDate} aria-describedby="checkDate-description" />
                <p id="checkDate-description" className="sr-only">Check date</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="userId">User ID</Label>
                <Input id="userId" defaultValue={item.userId} aria-describedby="userId-description" />
                <p id="userId-description" className="sr-only">User ID</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="stat">Status</Label>
                <Input id="stat" defaultValue={item.stat} aria-describedby="stat-description" />
                <p id="stat-description" className="sr-only">Transaction status</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={item.type} disabled>
                  <SelectTrigger id="type" aria-describedby="type-description">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deposit">Deposit</SelectItem>
                    <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                <p id="type-description" className="sr-only">Transaction type</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={item.email} aria-describedby="email-description" />
              <p id="email-description" className="sr-only">Customer email</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Input id="employmentStatus" defaultValue={item.employmentStatus} aria-describedby="employmentStatus-description" />
                <p id="employmentStatus-description" className="sr-only">Employment status</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="isFlagged">Flagged</Label>
                <Select defaultValue={item.isFlagged ? "Flagged" : "Normal"} disabled>
                  <SelectTrigger id="isFlagged" aria-describedby="isFlagged-description">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flagged">Flagged</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
                <p id="isFlagged-description" className="sr-only">Whether the transaction is flagged</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="flagReason">Flag Reason</Label>
              <Input id="flagReason" defaultValue={item.flagReason} aria-describedby="flagReason-description" />
              <p id="flagReason-description" className="sr-only">Reason for flagging</p>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="contactChanges">Contact Changes</Label>
              <Input id="contactChanges" defaultValue={item.contactChanges} aria-describedby="contactChanges-description" />
              <p id="contactChanges-description" className="sr-only">Contact change history</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="mot">MOT</Label>
                <Input id="mot" defaultValue={item.mot} type="number" aria-describedby="mot-description" />
                <p id="mot-description" className="sr-only">Method of transaction</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="purpose">Purpose</Label>
                <Input id="purpose" defaultValue={item.purpose} aria-describedby="purpose-description" />
                <p id="purpose-description" className="sr-only">Transaction purpose</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="productType">Product Type</Label>
                <Input id="productType" defaultValue={item.productType} aria-describedby="productType-description" />
                <p id="productType-description" className="sr-only">Product type</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="idType">ID Type</Label>
                <Input id="idType" defaultValue={item.idType} aria-describedby="idType-description" />
                <p id="idType-description" className="sr-only">Identification type</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="idNo">ID No.</Label>
                <Input id="idNo" defaultValue={item.idNo} aria-describedby="idNo-description" />
                <p id="idNo-description" className="sr-only">Identification number</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="sourceFund">Source of Fund</Label>
                <Input id="sourceFund" defaultValue={item.sourceFund} aria-describedby="sourceFund-description" />
                <p id="sourceFund-description" className="sr-only">Source of funds</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="currencyCode">Currency</Label>
                <Input id="currencyCode" defaultValue={item.currencyCode} aria-describedby="currencyCode-description" />
                <p id="currencyCode-description" className="sr-only">Currency code</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="cityCode">City Code</Label>
                <Input id="cityCode" defaultValue={item.cityCode} aria-describedby="cityCode-description" />
                <p id="cityCode-description" className="sr-only">City code</p>
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button disabled>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

// Viewer for flags table
function FlagsCellViewer({ item }: { item: z.infer<typeof flagsSchema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {new Date(item.date).toLocaleDateString()}
        </Button>
      </DrawerTrigger>
      <DrawerContent className={isMobile ? "h-[80vh]" : "w-[600px]"}>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.name}</DrawerTitle>
          <DrawerDescription>Flag Details</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="id">ID</Label>
                <Input id="id" defaultValue={item.id} disabled aria-describedby="id-description" />
                <p id="id-description" className="sr-only">Flag ID</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input id="transactionId" defaultValue={item.transactionId} disabled aria-describedby="transactionId-description" />
                <p id="transactionId-description" className="sr-only">Associated transaction ID</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="flag">Flag</Label>
                <Input id="flag" defaultValue={item.flag} aria-describedby="flag-description" />
                <p id="flag-description" className="sr-only">Flag type</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="suspCode">Susp. Code</Label>
                <Input id="suspCode" defaultValue={item.suspCode} aria-describedby="suspCode-description" />
                <p id="suspCode-description" className="sr-only">Suspicion code</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" defaultValue={item.reason} aria-describedby="reason-description" />
              <p id="reason-description" className="sr-only">Reason for flagging</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="score">Score</Label>
                <Input id="score" defaultValue={item.score} type="number" aria-describedby="score-description" />
                <p id="score-description" className="sr-only">Flag score</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="suspCodeDesc">Susp. Code Desc.</Label>
                <Input id="suspCodeDesc" defaultValue={item.suspCodeDesc} aria-describedby="suspCodeDesc-description" />
                <p id="suspCodeDesc-description" className="sr-only">Suspicion code description</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="acNum">A/C#</Label>
                <Input id="acNum" defaultValue={item.acNum} aria-describedby="acNum-description" />
                <p id="acNum-description" className="sr-only">Account number</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={item.name} aria-describedby="name-description" />
                <p id="name-description" className="sr-only">Customer name</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={item.type} disabled>
                  <SelectTrigger id="type" aria-describedby="type-description">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deposit">Deposit</SelectItem>
                    <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
                <p id="type-description" className="sr-only">Transaction type</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" defaultValue={item.amount} type="number" aria-describedby="amount-description" />
                <p id="amount-description" className="sr-only">Transaction amount</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="date">Date</Label>
                <Input id="date" defaultValue={item.date} aria-describedby="date-description" />
                <p id="date-description" className="sr-only">Transaction date</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="bankCode">Bank Code</Label>
                <Input id="bankCode" defaultValue={item.bankCode} aria-describedby="bankCode-description" />
                <p id="bankCode-description" className="sr-only">Bank code</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="country">Country</Label>
                <Input id="country" defaultValue={item.country} aria-describedby="country-description" />
                <p id="country-description" className="sr-only">Country code</p>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" defaultValue={item.notes} aria-describedby="notes-description" />
                <p id="notes-description" className="sr-only">Additional notes</p>
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button disabled>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export function DataTable({
  transactions: initialTransactionData = [],
  flags: initialFlagsData = [],
}: {
  transactions?: z.infer<typeof transactionSchema>[]
  flags?: z.infer<typeof flagsSchema>[]
}) {
  const [transactionData, setTransactionData] = React.useState(initialTransactionData)
  const [flagsData, setFlagsData] = React.useState(initialFlagsData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    // Transactions table
    contactChanges: false,
    mot: false,
    purpose: false,
    productType: false,
    idType: false,
    idNo: false,
    sourceFund: false,
    currencyCode: false,
    cityCode: false,
    // Flags table
    reason: false,
    suspCodeDesc: false,
    notes: false,
  })
  const [transactionFilters, setTransactionFilters] = React.useState<ColumnFiltersState>([])
  const [flagsFilters, setFlagsFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )
  const fileRef = useRef<HTMLInputElement | null>(null)

  const transactionDataIds = React.useMemo<UniqueIdentifier[]>(
    () => transactionData?.map(({ id }) => id) || [],
    [transactionData]
  )

  const flagsDataIds = React.useMemo<UniqueIdentifier[]>(
    () => flagsData?.map(({ id }) => id) || [],
    [flagsData]
  )

  const transactionTable = useReactTable({
    data: transactionData,
    columns: transactionColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters: transactionFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setTransactionFilters,
    onColumnVisibilityChange: setColumnVisibility,
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
      columnVisibility,
      rowSelection,
      columnFilters: flagsFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setFlagsFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent, table: typeof transactionTable | typeof flagsTable, dataIds: UniqueIdentifier[], setData: React.Dispatch<React.SetStateAction<any>>) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  // Handle file select and import (mock for visualization)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    toast.info(`Mock importing ${file.name}`)
    setTransactionData((prev) => [...prev, transactionData[0]]) // Reuse first mock entry for demo
    e.target.value = "" // Reset input
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
                {transactionTable
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
                      {column.id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <TabsContent value="raw" className="m-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <IconPlus className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline">Import</span>
              </Button>
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
                      <DraggableRow key={row.id} row={row} />
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
                      <DraggableRow key={row.id} row={row} />
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

function DraggableRow({ row }: { row: Row<z.infer<typeof transactionSchema> | z.infer<typeof flagsSchema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 hover:bg-muted/50"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="py-2">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}