"use client";

import { LayoutDashboard, FileText, Wallet, Receipt, UserCircle } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";

const navItems: NavItem[] = [
  { href: "/locataire", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/locataire/contrat", label: "Mon contrat", icon: FileText },
  { href: "/locataire/paiements", label: "Paiements", icon: Wallet },
  { href: "/locataire/quittances", label: "Quittances", icon: Receipt },
  { href: "/profil", label: "Profil", icon: UserCircle },
];

export default function LocataireLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={navItems} allowedRoles={["LOCATAIRE"]} brandLabel="MyKASA">
      {children}
    </AppShell>
  );
}
