"use client";

import { SidebarInset } from "@/components/ui/sidebar";

export default function WhitelistPage() {
  return (
    <SidebarInset>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-1 flex-col">
          <h1 className="text-xl font-semibold mb-4">Whitelist</h1>
          <p>Manage whitelist entries here (e.g., add/remove items).</p>
          {/* Add table or form as needed */}
        </div>
      </div>
    </SidebarInset>
  );
}