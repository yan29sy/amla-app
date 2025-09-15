import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"

export function SetThresh() {
  // Thresholds data from Python code
  const thresholds = [
    { name: "high_value", type: "float", defaultValue: 500000 },
    { name: "cash_deposit", type: "float", defaultValue: 500000 },
    { name: "quick_withdraw_pct", type: "float", defaultValue: 80 },
    { name: "time_period_days", type: "float", defaultValue: 30 },
    { name: "customer_cash_total", type: "float", defaultValue: 1000000 },
    { name: "num_deposits", type: "float", defaultValue: 5 },
    { name: "multiple_deposits_total", type: "float", defaultValue: 100000 },
    { name: "inactivity_days", type: "float", defaultValue: 90 },
    { name: "undeployed_cash", type: "float", defaultValue: 1000000 },
    { name: "num_contact_changes", type: "float", defaultValue: 3 },
    { name: "position_threshold", type: "float", defaultValue: 10000000 },
  ]

  // Handler for the Update button
//   const handleUpdate = () => {
//     const updatedThresholds = {};
//     thresholds.forEach((threshold) => {
//       const input = document.getElementById(threshold.name);
//       updatedThresholds[threshold.name] = parseFloat(input.value) || threshold.defaultValue;
//     });
//     console.log("Updated thresholds:", updatedThresholds);
//     // Add logic here to save updatedThresholds (e.g., API call or state update)
//     alert("Thresholds updated! Check console for values.");
//   }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
            className="w-[140px] h-8"
            variant="outline"
            size="sm"
            onClick={() => toast.info("Set Thresholds triggered")}
          >
            Set Thresholds
          </Button>
      </PopoverTrigger>
      <PopoverContent className="w-100">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Thresholds</h4>
            <p className="text-muted-foreground text-sm">
              Configure thresholds for AML monitoring.
            </p>
          </div>
          <div className="grid gap-2">
            {thresholds.map((threshold) => (
              <div key={threshold.name} className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor={threshold.name}>
                  {threshold.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Label>
                <Input
                  id={threshold.name}
                  type="number"
                  step="any"
                  defaultValue={threshold.defaultValue}
                  className="col-span-1 h-8"
                />
              </div>
            ))}
          </div>
          <Button 
        //   onClick={handleUpdate} 
          className="mt-4 w-full">
            Update
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}