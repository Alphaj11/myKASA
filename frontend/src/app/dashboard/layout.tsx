"use client";

import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  FileText,
  Wallet,
  Receipt,
  UserCircle,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/immeubles", label: "Immeubles", icon: Building2 },
  { href: "/dashboard/logements", label: "Logements", icon: Home },
  { href: "/dashboard/locataires", label: "Locataires", icon: Users },
  { href: "/dashboard/contrats", label: "Contrats", icon: FileText },
  { href: "/dashboard/paiements", label: "Paiements", icon: Wallet },
  { href: "/dashboard/quittances", label: "Quittances", icon: Receipt },
  { href: "/profil", label: "Profil", icon: UserCircle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={navItems} allowedRoles={["BAILLEUR"]} brandLabel="LocalTrack">
      {children}
    </AppShell>
  );
}
