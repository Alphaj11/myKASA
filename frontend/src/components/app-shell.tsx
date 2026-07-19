"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Building2, LogOut, Loader2, Mail, Menu, Moon, Sun, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { api, apiErrorMessage } from "@/lib/api";
import { homeForRole, useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

function NavLinks({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-2">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className="relative block" onClick={onNavigate}>
            {active && (
              <motion.span
                layoutId="active-nav"
                className="absolute inset-0 rounded-lg bg-sidebar-accent"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function EmailVerificationBanner() {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setIsSending(true);
    try {
      await api.post("/api/auth/resend-verification");
      setSent(true);
      toast.success("Lien de vérification renvoyé");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950 dark:text-amber-200">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 shrink-0" />
        Votre adresse email n&apos;est pas encore vérifiée.
      </div>
      <Button variant="outline" size="sm" onClick={resend} disabled={isSending || sent}>
        {isSending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
        {sent ? "Lien envoyé" : "Renvoyer le lien"}
      </Button>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8 w-8" />;

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function AppShell({
  children,
  navItems,
  allowedRoles,
  brandLabel,
}: {
  children: ReactNode;
  navItems: NavItem[];
  allowedRoles: UserRole[];
  brandLabel: string;
}) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(homeForRole(user.role));
    }
  }, [isLoading, user, allowedRoles, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = user.full_name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <header className="flex items-center justify-between border-b border-border/60 bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <div className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          {brandLabel}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)} title="Ouvrir le menu">
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="flex w-64 flex-col bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
          <div className="flex items-center gap-2 px-6 py-5 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            {brandLabel}
          </div>
          <NavLinks navItems={navItems} pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
          <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-4">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.full_name}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={logout} title="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <aside className="hidden w-64 flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-6 py-5 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          {brandLabel}
        </div>
        <NavLinks navItems={navItems} pathname={pathname} />
        <div className="flex items-center gap-3 border-t border-sidebar-border px-4 py-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.full_name}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user.email}</p>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={logout} title="Se déconnecter">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-muted/20 px-4 py-6 md:px-8 md:py-8">
        {!user.is_email_verified && <EmailVerificationBanner />}
        {children}
      </main>
    </div>
  );
}
