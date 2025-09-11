"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { DataTable } from "@/components/data-table";
import data from "./transactions/raw-and-filtered/data.json"; // Import data from raw-and-filtered

export default function HomePage() {
  return (
    <SidebarInset>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <p className="text-muted-foreground text-sm">
          View and filter raw transaction data for analysis.
        </p>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}