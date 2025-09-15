import { useIsMobile } from "@/hooks/use-mobile"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { z } from "zod"
import { transactionSchema } from "@/types/transactions"

type TransactionCellViewerProps = {
  item: z.infer<typeof transactionSchema>
}

export function TransactionCellViewer({ item }: TransactionCellViewerProps) {
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