import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"

export function SetFlags() {
  // Flag scores data from Python code
  const flagScores = [
    { name: "high_value", type: "int", defaultValue: 1 },
    { name: "cash_deposit", type: "int", defaultValue: 1 },
    { name: "quick_withdraw", type: "int", defaultValue: 2 },
    { name: "customer_cash_total", type: "int", defaultValue: 2 },
    { name: "multiple_deposits", type: "int", defaultValue: 1 },
    { name: "deposit_high_risk", type: "int", defaultValue: 2 },
    { name: "flagged_account", type: "int", defaultValue: 3 },
    { name: "total_value_over_time", type: "int", defaultValue: 2 },
    { name: "inactivity_deposit", type: "int", defaultValue: 2 },
    { name: "position_employment", type: "int", defaultValue: 2 },
    { name: "same_email_different_names", type: "int", defaultValue: 3 },
    { name: "undeployed_cash", type: "int", defaultValue: 2 },
    { name: "contact_changes", type: "int", defaultValue: 1 },
  ]

  // Handler for the Update button
  const handleUpdate = () => {
    const updatedFlagScores: { [key: string]: number } = {}
    flagScores.forEach((score) => {
      const input = document.getElementById(score.name) as HTMLInputElement | null
      updatedFlagScores[score.name] = input ? parseInt(input.value) || score.defaultValue : score.defaultValue
    })
    console.log("Updated flag scores:", updatedFlagScores)
    // Add logic here to save updatedFlagScores (e.g., API call or state update)
    alert("Flag scores updated! Check console for values.")
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
            className="w-[140px] h-8"
            variant="outline"
            size="sm"
            onClick={() => toast.info("Set Flag triggered")}
        >
            Set Flag Scores
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-100">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Flag Scores</h4>
            <p className="text-muted-foreground text-sm">
              Configure scores for flagged transactions.
            </p>
          </div>
          <div className="grid gap-2">
            {flagScores.map((score) => (
              <div key={score.name} className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor={score.name}>
                  {score.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Label>
                <Input
                  id={score.name}
                  type="number"
                  step="1" // Restrict to integers
                  defaultValue={score.defaultValue}
                  className="col-span-1 h-8"
                />
              </div>
            ))}
          </div>
          <Button onClick={handleUpdate} className="mt-4 w-full">
            Update
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}