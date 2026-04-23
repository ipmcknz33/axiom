import type { ReactNode } from "react";
import { WorkspaceNav } from "@/app/components/shell/workspace-nav";
import { SideNav } from "@/app/components/shell/side-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="workspace-layout">
      <WorkspaceNav />
      <div className="workspace-body">
        <SideNav />
        <main className="workspace-main">{children}</main>
      </div>
    </div>
  );
}
