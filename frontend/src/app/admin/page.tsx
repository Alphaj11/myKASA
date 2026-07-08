"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Building2, Home, FileText, Wallet } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { AdminStats } from "@/types";

const PLAN_COLORS: Record<string, string> = {
  FREEMIUM: "var(--color-chart-2)",
  PREMIUM: "var(--color-chart-1)",
  AGENCE: "var(--color-chart-4)",
};

function formatFCFA(value: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value)) + " FCFA";
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/api/admin/stats").then((res) => setStats(res.data));
  }, []);

  const kpis = stats
    ? [
        { label: "Bailleurs", value: stats.nb_bailleurs, icon: Users },
        { label: "Locataires", value: stats.nb_locataires, icon: Users },
        { label: "Immeubles", value: stats.nb_immeubles, icon: Building2 },
        { label: "Logements", value: stats.nb_logements, icon: Home },
        { label: "Contrats actifs", value: stats.nb_contrats_actifs, icon: FileText },
        { label: "Volume payé ce mois", value: formatFCFA(stats.volume_paiements_mois), icon: Wallet },
      ]
    : [];

  const planData = stats
    ? Object.entries(stats.repartition_plans).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vue globale de la plateforme</h1>
        <p className="text-sm text-muted-foreground">Statistiques agrégées sur tous les bailleurs.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats
          ? kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <kpi.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 text-xl font-bold">{kpi.value}</p>
                </Card>
              </motion.div>
            ))
          : Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">Répartition des abonnements bailleurs</h2>
        <div className="mt-4 h-72">
          {stats ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {planData.map((entry) => (
                    <Cell key={entry.name} fill={PLAN_COLORS[entry.name] ?? "var(--color-chart-1)"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </div>
      </Card>
    </div>
  );
}
