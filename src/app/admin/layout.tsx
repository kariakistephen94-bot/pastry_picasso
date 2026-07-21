import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import Toast from "@/components/shell/Toast";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AdminShell>
      {children}
      <Toast />
    </AdminShell>
  );
}
