"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();

  // Define breadcrumb mappings: { route: { title, description } }
  const breadcrumbMap: Record<
    string,
    { title: string; description: string }
  > = {
    "/": {
      title: "Raw and Filtered",
      description: "View and filter raw transaction data for analysis.",
    },
    "/transactions": {
      title: "Transactions Overview",
      description:
        "View and manage all transactions, including raw and filtered data or whitelist.",
    },
    "/transactions/raw-and-filtered": {
      title: "Raw and Filtered",
      description: "View and filter raw transaction data for analysis.",
    },
    "/transactions/whitelist": {
      title: "Whitelist",
      description: "Manage whitelisted transactions and settings.",
    },
    "/documentations": {
      title: "Documentations",
      description: "Access documentation resources, exports, and changelog.",
    },
    "/documentations/exports": {
      title: "Exports",
      description: "Export documentation files.",
    },
    "/documentations/changelog": {
      title: "Changelog",
      description: "View documentation change history.",
    },
    "/settings": {
      title: "Settings",
      description: "Configure application settings.",
    },
    "/settings/general": {
      title: "General",
      description: "Manage general settings.",
    },
    "/settings/team": {
      title: "Team",
      description: "Manage team members and roles.",
    },
    "/settings/limits": {
      title: "Limits",
      description: "Configure transaction limits.",
    },
  };

  // Get breadcrumb data for current route, default to home
  const { title, description } =
    breadcrumbMap[pathname] || breadcrumbMap["/"];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}