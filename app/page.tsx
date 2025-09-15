"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { DataTable } from "@/components/data-tables";

export default function HomePage() {
  return (
    <SidebarInset>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable transactions={[]} flags={[]} />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}