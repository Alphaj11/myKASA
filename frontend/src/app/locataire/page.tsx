"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, Mail, Phone, Wallet, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

      {contrats === null ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : contratActif ? (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Contrat en cours</h2>
            <Badge>Actif</Badge>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" /> Loyer mensuel
              </p>
              <p className="mt-1 text-lg font-bold">{formatFCFA(contratActif.loyer_mensuel)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Jour de paiement
              </p>
              <p className="mt-1 text-lg font-bold">Le {contratActif.jour_paiement}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Début du contrat</p>
              <p className="mt-1 text-lg font-bold">{contratActif.date_debut}</p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
