import { DashboardShell } from "@/components/layout/DashboardShell";

export default function ProtectedLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return <DashboardShell>{children}</DashboardShell>;
}
