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
import { flagsSchema } from "@/types/flags"

type FlagsCellViewerProps = {
  item: z.infer<typeof flagsSchema>
}

export function FlagsCellViewer({ item }: FlagsCellViewerProps) {
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