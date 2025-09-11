"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { DataTable } from "@/components/data-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import data from "./raw-and-filtered/data.json"; // Adjust path to your data.json
import { Button } from "@/components/ui/button";

export default function TransactionsPage() {
  return (
    <SidebarInset>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DataTable data={data} />
              <div className="flex gap-2 pt-4">
                <Link href="/transactions/raw-and-filtered">
                  <Button variant="outline">Go to Raw & Filtered</Button>
                </Link>
                <Link href="/transactions/whitelist">
                  <Button variant="outline">Go to Whitelist</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  );
}