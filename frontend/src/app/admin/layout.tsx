"use client";

import { LayoutDashboard, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";

const navItems: NavItem[] = [
  { href: "/admin", label: "Vue globale", icon: LayoutDashboard },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={navItems} allowedRoles={["ADMIN"]} brandLabel="LocalTrack Admin">
      {children}
    </AppShell>
  );
}
