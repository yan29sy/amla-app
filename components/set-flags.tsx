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

interface FlagScores {
  [key: string]: number;
}

interface SetFlagsProps {
  onFlagScoresChange: (newScores: Partial<FlagScores>) => void;
}

const FLAG_TYPES = [
  'high_value',
  'cash_deposit',
  'quick_withdraw',
  'customer_cash_total',
  'multiple_deposits',
  'deposit_high_risk',
  'flagged_account',
  'total_value_over_time',
  'inactivity_deposit',
  'position_employment',
  'undeployed_cash',
  'contact_changes',
  'same_email_different_names',
]

export function SetFlags({ onFlagScoresChange }: SetFlagsProps) {
  const [open, setOpen] = React.useState(false)
  const [scores, setScores] = React.useState<FlagScores>(
    Object.fromEntries(FLAG_TYPES.map(type => [type, 1]))
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setScores(prev => ({ ...prev, [name]: Number(value) }))
  }

  const handleSubmit = () => {
    onFlagScoresChange(scores)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Set Flag Scores
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Flag Scores</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {FLAG_TYPES.map(flag => (
            <div key={flag} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={flag} className="col-span-2">
                {flag.replace(/_/g, ' ')}
              </Label>
              <Input
                id={flag}
                name={flag}
                type="number"
                value={scores[flag]}
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