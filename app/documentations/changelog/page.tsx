

import { SidebarInset } from "@/components/ui/sidebar";

export default function ChangelogPage() {
  return (
    <SidebarInset>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <p className="text-muted-foreground text-sm">
          Access documentation resources, exports, and changelog.
        </p>
        <div className="flex flex-1 flex-col">
          <h1 className="text-xl font-semibold mb-4">Documentations</h1>
          <p>Overview of all documentation resources.</p>
        </div>
      </div>
    </SidebarInset>
  );
}