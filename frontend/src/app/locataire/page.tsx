"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, Mail, Phone, Wallet, FileText, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { MaFicheLocataire, MonContrat } from "@/types";

function formatFCFA(value: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(value)) + " FCFA";
}

export default function LocataireDashboardPage() {
  const [fiches, setFiches] = useState<MaFicheLocataire[] | null>(null);
  const [contrats, setContrats] = useState<MonContrat[] | null>(null);

  useEffect(() => {
    api.get<MaFicheLocataire[]>("/api/me/fiches").then((res) => setFiches(res.data));
    api.get<MonContrat[]>("/api/me/contrats").then((res) => setContrats(res.data));
  }, []);

  const contratActif = contrats?.find((c) => c.statut === "ACTIF");
  const totalPointsDispo = contrats?.reduce((sum, c) => sum + c.points_disponibles, 0) ?? 0;
  const totalPointsCumules = contrats?.reduce((sum, c) => sum + c.points_cumules, 0) ?? 0;
  const peutUtiliserPoints = totalPointsDispo >= 1500;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon espace locataire</h1>
        <p className="text-sm text-muted-foreground">Retrouvez votre logement, votre contrat et vos paiements.</p>
      </div>

      {fiches === null ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : fiches.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Aucun logement ne vous est encore associé. Contactez votre bailleur pour qu&apos;il vous rattache
          à votre fiche locataire.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fiches.map((fiche, i) => (
            <motion.div key={fiche.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Home className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold">
                  {fiche.logement_nom ?? "Pas encore de logement"}
                  {fiche.immeuble_nom ? ` — ${fiche.immeuble_nom}` : ""}
                </h3>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{fiche.bailleur_nom}</p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> {fiche.bailleur_email}
                  </p>
                  {fiche.bailleur_telephone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> {fiche.bailleur_telephone}
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Contrat actif + Points */}
      {contrats === null ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : contratActif ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Loyer */}
          <Card className="p-5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" /> Loyer mensuel
            </p>
            <p className="mt-1 text-2xl font-bold">{formatFCFA(contratActif.loyer_mensuel)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Dû le {contratActif.jour_paiement} du mois</p>
            {contratActif.en_retard && (
              <Badge variant="destructive" className="mt-2">En retard</Badge>
            )}
          </Card>

          {/* Points MyKASA */}
          <Card className={`p-5 ${peutUtiliserPoints ? "border-primary/40 bg-primary/5" : ""}`}>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5" /> Points MyKASA
            </p>
            <p className="mt-1 text-2xl font-bold">
              {totalPointsDispo}
              <span className="text-sm font-normal text-muted-foreground"> pts</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{totalPointsCumules} pts cumulés au total</p>
            {peutUtiliserPoints ? (
              <Badge className="mt-2 bg-primary text-primary-foreground">Utilisables sur votre loyer</Badge>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                {1500 - totalPointsDispo} pts restants avant utilisation
              </p>
            )}
          </Card>

          {/* Contrat */}
          <Card className="p-5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Contrat en cours
            </p>
            <p className="mt-1 text-sm font-semibold">{contratActif.logement_nom}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{contratActif.immeuble_nom}</p>
            <p className="mt-1 text-xs text-muted-foreground">Depuis le {contratActif.date_debut}</p>
          </Card>
        </div>
      ) : null}

      {/* CTA paiement */}
      {contratActif && (
        <Link
          href="/locataire/contrat"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Wallet className="mr-2 h-4 w-4" /> Payer mon loyer
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
