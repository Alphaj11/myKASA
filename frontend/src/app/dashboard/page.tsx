"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, AlertTriangle, Home, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types";

function formatFCFA(value: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value)) + " FCFA";
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/api/dashboard/stats").then((res) => setStats(res.data));
  }, []);

  const kpis = stats
    ? [
        {
          label: "Loyers encaissés ce mois",
          value: formatFCFA(stats.loyers_encaisses_mois),
          icon: Wallet,
          accent: "text-primary bg-accent",
        },
        {
          label: "Loyers en retard",
          value: `${stats.contrats_en_retard} contrat(s)`,
          icon: AlertTriangle,
          accent: "text-amber-600 bg-amber-100 dark:bg-amber-950",
        },
        {
          label: "Logements occupés / vacants",
          value: `${stats.logements_occupes} / ${stats.logements_vacants}`,
          icon: Home,
          accent: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950",
        },
        {
          label: "Locataires enregistrés",
          value: `${stats.nb_locataires}`,
          icon: Users,
          accent: "text-foreground bg-muted",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de votre activité locative.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats
          ? kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="p-5">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.accent}`}>
                    <kpi.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 text-xl font-bold">{kpi.value}</p>
                </Card>
              </motion.div>
            ))
          : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">Revenus des 6 derniers mois</h2>
        <div className="mt-4 h-72">
          {stats ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenus_par_mois}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={80} />
                <Tooltip formatter={(value) => formatFCFA(Number(value))} />
                <Bar dataKey="montant" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </div>
      </Card>
    </div>
  );
}
