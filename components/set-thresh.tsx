import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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

interface SetThreshProps {
  onThresholdChange: (newThresholds: Partial<Thresholds>) => void;
}

export function SetThresh({ onThresholdChange }: SetThreshProps) {
  const [open, setOpen] = React.useState(false)
  const [thresholds, setThresholds] = React.useState<Thresholds>({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setThresholds(prev => ({ ...prev, [name]: Number(value) }))
  }

  const handleSubmit = () => {
    onThresholdChange(thresholds)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Set Thresholds
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Thresholds</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {Object.keys(thresholds).map(key => (
            <div key={key} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={key} className="col-span-2">
                {key.replace(/_/g, ' ')}
              </Label>
              <Input
                id={key}
                name={key}
                type="number"
                value={thresholds[key as keyof Thresholds]}
                onChange={handleChange}
                className="col-span-2"
              />
            </div>
          ))}
          <Button onClick={handleSubmit}>Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}