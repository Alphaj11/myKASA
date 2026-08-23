"use client";

import { LayoutDashboard, Users, UserCircle } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";

const navItems: NavItem[] = [
  { href: "/admin", label: "Vue globale", icon: LayoutDashboard },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/profil", label: "Profil", icon: UserCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={navItems} allowedRoles={["ADMIN"]} brandLabel="MyKASA Admin">
      {children}
    </AppShell>
  );
}
