import { ColumnDef } from "@tanstack/react-table"
import { z } from "zod"
import { transactionSchema } from "@/types/transactions"
import { flagsSchema } from "@/types/flags"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { IconChevronDown, IconCircleCheckFilled, IconDotsVertical, IconLoader, IconGripVertical, IconEdit } from "@tabler/icons-react"
import { TransactionCellViewer } from "@/components/transaction-cell-viewer"
import { FlagsCellViewer } from "@/components/flags-cell-viewer"
import { useSortable } from "@dnd-kit/sortable"

// Drag handle component
// export function DragHandle({ id }: { id: number }) {
//   const { attributes, listeners } = useSortable({ id })
//   return (
//     <Button
//       {...attributes}
//       {...listeners}
//       variant="ghost"
//       size="icon"
//       className="text-muted-foreground size-7 hover:bg-transparent"
//     >
//       <IconGripVertical className="text-muted-foreground size-3" />
//       <span className="sr-only">Drag to reorder</span>
//     </Button>
//   )
// }

// Columns for transactions table (Raw tab)
export const transactionColumns: ColumnDef<z.infer<typeof transactionSchema>>[] = [
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
    enableHiding: false,
  },
  // {
  //   id: "drag",
  //   header: () => null,
  //   cell: ({ row }) => <DragHandle id={row.original.id} />,
  //   enableHiding: false,
  // },
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
]

// Columns for flags table (Filtered tab)
export const flagsColumns: ColumnDef<z.infer<typeof flagsSchema>>[] = [
  {
    id: "actions",
    cell: ({ row, table }) => (
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
          <DropdownMenuItem
            onClick={() => table.options.meta?.onEditNote?.(row.original.id, row.original.notes)}
            aria-label="Edit note"
          >
            Add/Edit Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
  },
  // {
  //   id: "drag",
  //   header: () => null,
  //   cell: ({ row }) => <DragHandle id={row.original.id} />,
  //   enableHiding: false,
  // },
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
            currency: "USD", // Flags table doesn't have currencyCode
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
    cell: ({ row, table }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => table.options.meta?.onEditNote?.(row.original.id, row.original.notes)}
        aria-label="Edit note"
      >
        <IconEdit className="h-4 w-4" />
      </Button>
    ),
    enableHiding: true,
  },
]