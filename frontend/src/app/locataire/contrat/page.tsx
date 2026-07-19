"use client";

import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { MonContrat, StatutContrat } from "@/types";

const statutLabels: Record<StatutContrat, string> = {
  ACTIF: "Actif",
  ARCHIVE: "Archivé",
  RESILIE: "Résilié",
};

export default function MonContratPage() {
  const [contrats, setContrats] = useState<MonContrat[] | null>(null);

  useEffect(() => {
    api.get<MonContrat[]>("/api/me/contrats").then((res) => setContrats(res.data));
  }, []);

  async function download(contrat: MonContrat) {
    try {
      const res = await api.get(`/api/contrats/${contrat.id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contrat_${contrat.id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Impossible de télécharger le contrat");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon contrat</h1>
        <p className="text-sm text-muted-foreground">Historique de vos contrats de location.</p>
      </div>

      {contrats === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : contrats.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <FileText className="h-8 w-8" />
          Aucun contrat pour l&apos;instant.
        </Card>
      ) : (
        <div className="space-y-4">
          {contrats.map((contrat) => (
            <Card key={contrat.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {contrat.logement_nom} — {contrat.immeuble_nom}
                  </h3>
                  <p className="text-sm text-muted-foreground">Bailleur : {contrat.bailleur_nom}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={contrat.statut === "ACTIF" ? "default" : "secondary"}>
                    {statutLabels[contrat.statut]}
                  </Badge>
                  {contrat.en_retard && <Badge variant="destructive">Paiement en retard</Badge>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Début</p>
                  <p className="font-medium">{contrat.date_debut}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fin</p>
                  <p className="font-medium">{contrat.date_fin ?? "Indéterminée"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Loyer mensuel</p>
                  <p className="font-medium">{new Intl.NumberFormat("fr-FR").format(contrat.loyer_mensuel)} FCFA</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jour de paiement</p>
                  <p className="font-medium">Le {contrat.jour_paiement}</p>
                </div>
              </div>
              {contrat.pdf_path && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => download(contrat)}>
                  <Download className="mr-1 h-4 w-4" /> Télécharger le PDF
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
