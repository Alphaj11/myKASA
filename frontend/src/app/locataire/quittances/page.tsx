"use client";

import { useEffect, useState } from "react";
import { Download, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import type { MaQuittance } from "@/types";

export default function MesQuittancesPage() {
  const [quittances, setQuittances] = useState<MaQuittance[] | null>(null);

  useEffect(() => {
    api.get<MaQuittance[]>("/api/me/quittances").then((res) => setQuittances(res.data));
  }, []);

  async function download(quittance: MaQuittance) {
    try {
      const res = await api.get(`/api/quittances/${quittance.id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `quittance_${quittance.numero}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Impossible de télécharger la quittance");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mes quittances</h1>
        <p className="text-sm text-muted-foreground">Téléchargez vos quittances de loyer.</p>
      </div>

      {quittances === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : quittances.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Receipt className="h-8 w-8" />
          Aucune quittance pour l&apos;instant.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Générée le</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quittances.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">{q.numero}</TableCell>
                  <TableCell>{q.periode}</TableCell>
                  <TableCell>{new Date(q.genere_le).toLocaleString("fr-FR")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" onClick={() => download(q)} title="Télécharger">
                      <Download className="h-4 w-4" />
                    </Button>
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
