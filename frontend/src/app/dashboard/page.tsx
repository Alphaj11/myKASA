"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet, AlertTriangle, Home, Users, TrendingUp, Clock, Lock,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DashboardStats, Immeuble } from "@/types";

function formatFCFA(value: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value)) + " FCFA";
}

function formatPct(value: number) {
  return value.toFixed(1) + " %";
}

const PERIODE_OPTIONS = [
  { label: "3 derniers mois", value: "3" },
  { label: "6 derniers mois", value: "6" },
  { label: "12 derniers mois", value: "12" },
  { label: "Cette année", value: "annee" },
];

function periodeToParams(val: string): Record<string, string> {
  if (val === "annee") {
    const y = new Date().getFullYear();
    return { periode_debut: `${y}-01`, periode_fin: `${y}-12` };
  }
  return { nb_mois: val };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isPremium = user?.plan === "PREMIUM" || user?.plan === "AGENCE";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [periode, setPeriode] = useState("6");
  const [immeubleId, setImmeubleId] = useState<string>("");
  const [typeLogement, setTypeLogement] = useState<string>("");

  function load() {
    const params: Record<string, string> = { ...periodeToParams(periode) };
    if (isPremium && immeubleId) params.immeuble_id = immeubleId;
    if (isPremium && typeLogement) params.type_logement = typeLogement;
    api.get<DashboardStats>("/api/dashboard/stats", { params }).then((r) => setStats(r.data));
  }

  useEffect(() => {
    api.get<Immeuble[]>("/api/immeubles").then((r) => setImmeubles(r.data));
  }, []);

  useEffect(() => { load(); }, [periode, immeubleId, typeLogement]);

  const kpis = stats
    ? [
        {
          label: "Encaissé (période)",
          value: formatFCFA(stats.loyers_encaisses_mois),
          icon: Wallet,
          color: "text-primary bg-primary/10",
        },
        {
          label: "En attente",
          value: formatFCFA(stats.montant_en_attente),
          icon: Clock,
          color: "text-amber-600 bg-amber-100 dark:bg-amber-950",
        },
        {
          label: "Taux d'impayés",
          value: formatPct(stats.taux_impayes),
          icon: AlertTriangle,
          color: stats.taux_impayes > 20
            ? "text-destructive bg-destructive/10"
            : "text-amber-600 bg-amber-100 dark:bg-amber-950",
        },
        {
          label: "Taux d'occupation",
          value: formatPct(stats.taux_occupation),
          icon: Home,
          color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950",
        },
        {
          label: "Revenu prévisionnel",
          value: formatFCFA(stats.revenu_previsionnel),
          icon: TrendingUp,
          color: "text-foreground bg-muted",
        },
        {
          label: "Locataires",
          value: `${stats.nb_locataires}`,
          icon: Users,
          color: "text-foreground bg-muted",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de votre activité locative.</p>
      </div>

      {/* ── Filtres ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <Select value={periode} onValueChange={setPeriode}
          items={PERIODE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtre immeuble — premium */}
        <div className="relative">
          <Select
            value={immeubleId}
            onValueChange={isPremium ? setImmeubleId : undefined}
            items={[
              { value: "", label: "Toutes les propriétés" },
              ...immeubles.map((i) => ({ value: String(i.id), label: i.nom })),
            ]}
            disabled={!isPremium}
          >
            <SelectTrigger className="w-48 h-8 text-xs">
              {!isPremium && <Lock className="mr-1 h-3 w-3 text-muted-foreground" />}
              <SelectValue placeholder="Toutes les propriétés" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les propriétés</SelectItem>
              {immeubles.map((i) => (
                <SelectItem key={i.id} value={String(i.id)}>{i.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtre type logement — premium */}
        <div className="relative">
          <Select
            value={typeLogement}
            onValueChange={isPremium ? setTypeLogement : undefined}
            disabled={!isPremium}
            items={[
              { value: "", label: "Tous les types" },
              { value: "STUDIO", label: "Studio" },
              { value: "APPARTEMENT", label: "Appartement" },
              { value: "MAISON", label: "Maison" },
              { value: "CHAMBRE", label: "Chambre" },
              { value: "VILLA", label: "Villa" },
              { value: "BUREAU", label: "Bureau" },
            ]}
          >
            <SelectTrigger className="w-44 h-8 text-xs">
              {!isPremium && <Lock className="mr-1 h-3 w-3 text-muted-foreground" />}
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les types</SelectItem>
              <SelectItem value="STUDIO">Studio</SelectItem>
              <SelectItem value="APPARTEMENT">Appartement</SelectItem>
              <SelectItem value="MAISON">Maison</SelectItem>
              <SelectItem value="CHAMBRE">Chambre</SelectItem>
              <SelectItem value="VILLA">Villa</SelectItem>
              <SelectItem value="BUREAU">Bureau</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isPremium && (
          <p className="self-center text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" /> Filtres propriété/type réservés Premium
          </p>
        )}
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats
          ? kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="p-4">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.color}`}>
                    <kpi.icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-xs text-muted-foreground leading-tight">{kpi.label}</p>
                  <p className="mt-1 text-base font-bold leading-tight">{kpi.value}</p>
                </Card>
              </motion.div>
            ))
          : Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
      </div>

      {/* ── Courbe revenus ───────────────────────────────────────────────── */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Évolution des revenus</h2>
        <div className="h-64">
          {stats ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenus_par_mois}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={75}
                  tickFormatter={(v) => new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(v)} />
                <Tooltip formatter={(v) => formatFCFA(Number(v))} labelFormatter={(l) => `Mois : ${l}`} />
                <Area
                  type="monotone"
                  dataKey="montant"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Skeleton className="h-full w-full" />
          )}
        </div>
      </Card>

      {/* ── Top logements ────────────────────────────────────────────────── */}
      {(stats?.revenus_par_logement?.length ?? 0) > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Revenus par logement</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats!.revenus_par_logement}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(v)}
                />
                <YAxis type="category" dataKey="logement" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v) => formatFCFA(Number(v))} />
                <Bar dataKey="montant" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
