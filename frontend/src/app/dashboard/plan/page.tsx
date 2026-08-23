"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Loader2, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { PlanType, PlanUsage } from "@/types";

interface PlanConfig {
  key: PlanType;
  label: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    key: "FREEMIUM",
    label: "Gratuit",
    price: "0 FCFA",
    description: "Pour débuter et tester MyKASA.",
    features: [
      "1 propriété",
      "2 logements au total",
      "Contrats et quittances PDF",
      "Code MyKASA locataire",
      "Tableau de bord basique",
    ],
  },
  {
    key: "PREMIUM",
    label: "Premium",
    price: "3 000 FCFA / mois",
    description: "Pour les bailleurs actifs avec plusieurs biens.",
    highlight: true,
    features: [
      "3 propriétés",
      "Logements illimités par propriété",
      "Paiement loyer via CinetPay",
      "Système de points locataire",
      "Rappels SMS automatiques",
      "Export financier PDF",
      "Historique complet",
    ],
  },
  {
    key: "AGENCE",
    label: "Agence",
    price: "15 000 FCFA / mois",
    description: "Pour les gestionnaires immobiliers professionnels.",
    features: [
      "Propriétés et logements illimités",
      "Gestion multi-bailleurs",
      "Portail propriétaire (lecture seule)",
      "Relevés mensuels automatiques envoyés aux propriétaires",
      "Suivi des demandes de maintenance",
      "Quittances et contrats à votre logo",
      "Rapport fiscal annuel",
      "Support prioritaire",
    ],
  },
];

function UsageBar({ current, max, label }: { current: number; max: number | null; label: string }) {
  const pct = max === null ? 0 : Math.min((current / max) * 100, 100);
  const atLimit = max !== null && current >= max;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={atLimit ? "text-destructive font-semibold" : "text-foreground"}>
          {current} / {max === null ? "∞" : max}
        </span>
      </div>
      {max !== null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${atLimit ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function PlanPage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<PlanUsage | null>(null);

  useEffect(() => {
    if (user?.role === "BAILLEUR" || user?.role === "GESTIONNAIRE") {
      api.get<PlanUsage>("/api/auth/me/plan").then((r) => setUsage(r.data)).catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Plans & Tarifs</h1>
        <p className="text-sm text-muted-foreground">
          Choisissez le plan adapté à votre activité.
        </p>
      </div>

      {/* Usage actuel */}
      {usage && (
        <Card className="p-5 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-4 w-4 text-primary" />
            <span className="font-semibold">
              Plan actuel : <span className="text-primary">{usage.plan_label}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <UsageBar current={usage.immeubles.current} max={usage.immeubles.max} label="Propriétés" />
            <UsageBar current={usage.logements.current} max={usage.logements.max} label="Logements" />
          </div>
        </Card>
      )}

      {/* Grille des plans */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = user.plan === plan.key;
          return (
            <Card
              key={plan.key}
              className={`relative flex flex-col p-5 ${
                plan.highlight ? "border-primary shadow-md" : ""
              } ${isCurrent ? "ring-2 ring-primary" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Recommandé
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute right-3 top-3">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                    Actuel
                  </span>
                </div>
              )}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {plan.key === "AGENCE" ? (
                    <Zap className="h-4 w-4 text-primary" />
                  ) : (
                    <Crown className="h-4 w-4 text-primary" />
                  )}
                  <h2 className="font-bold">{plan.label}</h2>
                </div>
                <p className="text-2xl font-bold">{plan.price}</p>
                <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="flex-1 space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Button variant="outline" disabled className="w-full">
                  Plan actuel
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  disabled
                >
                  {/* CinetPay : à connecter */}
                  Passer à {plan.label}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Le paiement des plans sera disponible via CinetPay (MTN MoMo, Orange Money, VISA).
      </p>
    </div>
  );
}
