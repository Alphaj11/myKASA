"use client";

import { useEffect, useState } from "react";
import { Download, FileText, PenLine, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignatureCanvas } from "@/components/signature-canvas";
import { api } from "@/lib/api";
import type { MonContrat, StatutContrat } from "@/types";

const statutConfig: Record<StatutContrat, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  EN_ATTENTE_SIGNATURE: { label: "À signer", variant: "outline" },
  ACTIF: { label: "Actif", variant: "default" },
  ARCHIVE: { label: "Archivé", variant: "secondary" },
  RESILIE: { label: "Résilié", variant: "destructive" },
};

export default function MonContratPage() {
  const [contrats, setContrats] = useState<MonContrat[] | null>(null);
  const [signingId, setSigningId] = useState<number | null>(null);

  function load() {
    api.get<MonContrat[]>("/api/me/contrats").then((res) => setContrats(res.data));
  }

  useEffect(load, []);

  async function download(contrat: MonContrat) {
    try {
      const res = await api.get(`/api/contrats/${contrat.id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrat_${contrat.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Impossible de télécharger le contrat");
    }
  }

  async function handleSignature(blob: Blob) {
    if (!signingId) return;
    const fd = new FormData();
    fd.append("file", blob, "signature.png");
    await api.post(`/api/contrats/${signingId}/signer-locataire`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("Signature enregistrée — contrat activé !");
    setSigningId(null);
    load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Mon contrat</h1>
        <p className="text-sm text-muted-foreground">Vos contrats de location et leur statut de signature.</p>
      </div>

      <Dialog open={signingId !== null} onOpenChange={(v) => !v && setSigningId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Signer le contrat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            En signant, vous acceptez les termes du contrat de bail. Votre signature a valeur légale.
          </p>
          {signingId !== null && (
            <SignatureCanvas onSave={handleSignature} onCancel={() => setSigningId(null)} />
          )}
        </DialogContent>
      </Dialog>

      {contrats === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : contrats.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <FileText className="h-8 w-8" />
          Aucun contrat pour l&apos;instant.
        </Card>
      ) : (
        <div className="space-y-4">
          {contrats.map((contrat) => {
            const cfg = statutConfig[contrat.statut];
            const needsSignature = contrat.statut === "EN_ATTENTE_SIGNATURE" && !contrat.signature_locataire_url;
            return (
              <Card key={contrat.id} className={`p-5 ${needsSignature ? "border-yellow-400 dark:border-yellow-600" : ""}`}>
                {needsSignature && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-300">
                    <PenLine className="h-4 w-4 shrink-0" />
                    Ce contrat attend votre signature pour être activé.
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{contrat.logement_nom} — {contrat.immeuble_nom}</h3>
                    <p className="text-sm text-muted-foreground">Bailleur : {contrat.bailleur_nom}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    {contrat.en_retard && <Badge variant="destructive">Paiement en retard</Badge>}
                    {contrat.signature_locataire_url && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Signé par vous
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><p className="text-muted-foreground">Début</p><p className="font-medium">{contrat.date_debut}</p></div>
                  <div><p className="text-muted-foreground">Fin</p><p className="font-medium">{contrat.date_fin ?? "Indéterminée"}</p></div>
                  <div><p className="text-muted-foreground">Loyer mensuel</p><p className="font-medium">{new Intl.NumberFormat("fr-FR").format(contrat.loyer_mensuel)} FCFA</p></div>
                  <div><p className="text-muted-foreground">Jour de paiement</p><p className="font-medium">Le {contrat.jour_paiement}</p></div>
                </div>
                <div className="mt-4 flex gap-2">
                  {needsSignature && (
                    <Button size="sm" onClick={() => setSigningId(contrat.id)}>
                      <PenLine className="mr-1 h-3.5 w-3.5" /> Signer le contrat
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => download(contrat)}>
                    <Download className="mr-1 h-4 w-4" /> Télécharger le PDF
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
