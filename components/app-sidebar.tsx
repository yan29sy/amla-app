"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  }, 
  // In data.navMain
navMain: [
  {
    title: "Transactions",
    url: "/transactions",
    icon: SquareTerminal,
    isActive: true,
    items: [
      {
        title: "Raw and Filtered",
        url: "/transactions/raw-and-filtered",
      },
      {
        title: "Whitelist",
        url: "/transactions/whitelist",
      },
    ],
  },
  {
    title: "Documentations",
    url: "/documentations",
    icon: BookOpen,
    items: [
      {
        title: "Exports",
        url: "/documentations/exports",
      },
      {
        title: "Changelog",
        url: "/documentations/changelog",
      },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
    items: [
      {
        title: "General",
        url: "/settings/general",
      },
      {
        title: "Team",
        url: "/settings/team",
      },
      {
        title: "Limits",
        url: "/settings/limits",
      },
    ],
  },
],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <NavUser user={data.user} />
        {/* <TeamSwitcher teams={data.teams} /> */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter> */}
      <SidebarRail />
    </Sidebar>
  )
}
