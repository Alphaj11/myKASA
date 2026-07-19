"use client";

import { useEffect, useState } from "react";
import { Download, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { ModePaiement, MonPaiement } from "@/types";

const modeLabels: Record<ModePaiement, string> = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  MOBILE_MONEY: "Mobile Money",
  AUTRE: "Autre",
};

export default function MesPaiementsPage() {
  const [paiements, setPaiements] = useState<MonPaiement[] | null>(null);

  useEffect(() => {
    api.get<MonPaiement[]>("/api/me/paiements").then((res) => setPaiements(res.data));
  }, []);

  async function downloadQuittance(quittanceId: number) {
    try {
      const res = await api.get(`/api/quittances/${quittanceId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quittance_${quittanceId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Impossible de télécharger la quittance");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes paiements</h1>
        <p className="text-sm text-muted-foreground">Historique de vos loyers versés.</p>
      </div>

      {paiements === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : paiements.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Wallet className="h-8 w-8" />
          Aucun paiement enregistré pour l&apos;instant.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logement</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Quittance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paiements.map((paiement) => (
                <TableRow key={paiement.id}>
                  <TableCell className="font-medium">{paiement.logement_nom}</TableCell>
                  <TableCell>{paiement.periode}</TableCell>
                  <TableCell>{new Intl.NumberFormat("fr-FR").format(paiement.montant)} FCFA</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{modeLabels[paiement.mode_paiement]}</Badge>
                  </TableCell>
                  <TableCell>{paiement.date_paiement}</TableCell>
                  <TableCell className="text-right">
                    {paiement.quittance_id && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Télécharger la quittance"
                        onClick={() => downloadQuittance(paiement.quittance_id as number)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
