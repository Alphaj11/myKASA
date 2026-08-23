"use client";

import {
  LayoutDashboard,
  Building2,
  Crown,
  Home,
  Users,
  FileText,
  Wallet,
  Receipt,
  UserCircle,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";

const bailleurNavItems: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/immeubles", label: "Propriétés", icon: Building2 },
  { href: "/dashboard/logements", label: "Logements", icon: Home },
  { href: "/dashboard/locataires", label: "Locataires", icon: Users },
  { href: "/dashboard/contrats", label: "Contrats", icon: FileText },
  { href: "/dashboard/paiements", label: "Paiements", icon: Wallet },
  { href: "/dashboard/quittances", label: "Quittances", icon: Receipt },
  { href: "/dashboard/plan", label: "Plans & Tarifs", icon: Crown },
  { href: "/profil", label: "Profil", icon: UserCircle },
];

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Vue globale", icon: LayoutDashboard },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/profil", label: "Profil", icon: UserCircle },
];

const locataireNavItems: NavItem[] = [
  { href: "/locataire", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/locataire/contrat", label: "Mon contrat", icon: FileText },
  { href: "/locataire/paiements", label: "Paiements", icon: Wallet },
  { href: "/locataire/quittances", label: "Quittances", icon: Receipt },
  { href: "/profil", label: "Profil", icon: UserCircle },
];

export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const navItems =
    user?.role === "ADMIN" ? adminNavItems : user?.role === "LOCATAIRE" ? locataireNavItems : bailleurNavItems;
  const brandLabel = user?.role === "ADMIN" ? "MyKASA Admin" : "MyKASA";

  return (
    <AppShell navItems={navItems} allowedRoles={["ADMIN", "BAILLEUR", "LOCATAIRE"]} brandLabel={brandLabel}>
      {children}
    </AppShell>
  );
}
