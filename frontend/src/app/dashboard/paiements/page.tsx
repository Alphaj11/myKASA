"use client";

import { useEffect, useState } from "react";
import { Plus, Wallet, Download, Loader2, AlertTriangle, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiErrorMessage } from "@/lib/api";
import type { Contrat, Locataire, ModePaiement, Paiement } from "@/types";

const modeLabels: Record<ModePaiement, string> = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  MOBILE_MONEY: "Mobile Money",
  AUTRE: "Autre",
};

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[] | null>(null);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    contrat_id: "",
    montant: "",
    periode: currentPeriod(),
    mode_paiement: "MOBILE_MONEY" as ModePaiement,
  });

  function load() {
    api.get<Paiement[]>("/api/paiements").then((res) => setPaiements(res.data));
    api.get<Contrat[]>("/api/contrats").then((res) => setContrats(res.data));
    api.get<Locataire[]>("/api/locataires").then((res) => setLocataires(res.data));
  }

  useEffect(load, []);

  function contratLabel(id: number) {
    const contrat = contrats.find((c) => c.id === id);
    if (!contrat) return `Contrat #${id}`;
    const locataire = locataires.find((l) => l.id === contrat.locataire_id);
    return locataire ? `${locataire.prenom} ${locataire.nom}` : `Contrat #${id}`;
  }

  function handleContratChange(contratId: string | null) {
    const contrat = contrats.find((c) => String(c.id) === contratId);
    setForm({
      ...form,
      contrat_id: contratId ?? "",
      montant: contrat ? String(contrat.loyer_mensuel) : form.montant,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contrat_id) {
      toast.error("Sélectionnez un contrat");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/api/paiements", {
        contrat_id: Number(form.contrat_id),
        montant: Number(form.montant),
        periode: form.periode,
        mode_paiement: form.mode_paiement,
      });
      toast.success("Paiement enregistré, quittance générée");
      setForm({ contrat_id: "", montant: "", periode: currentPeriod(), mode_paiement: "MOBILE_MONEY" });
      setOpen(false);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredPaiements = paiements?.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return contratLabel(p.contrat_id).toLowerCase().includes(q) || p.periode.includes(q);
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paiements</h1>
          <p className="text-sm text-muted-foreground">Historique complet des loyers encaissés.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button disabled={contrats.length === 0} />}>
            <Plus className="mr-1 h-4 w-4" /> Enregistrer un paiement
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau paiement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Contrat</Label>
                <Select
                  value={form.contrat_id}
                  onValueChange={handleContratChange}
                  items={contrats.map((c) => ({ value: String(c.id), label: contratLabel(c.id) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un contrat" />
                  </SelectTrigger>
                  <SelectContent>
                    {contrats.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {contratLabel(c.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periode">Période (AAAA-MM)</Label>
                  <Input
                    id="periode"
                    required
                    value={form.periode}
                    onChange={(e) => setForm({ ...form, periode: e.target.value })}
                    placeholder="2026-07"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="montant">Montant (FCFA)</Label>
                  <Input
                    id="montant"
                    type="number"
                    min={0}
                    required
                    value={form.montant}
                    onChange={(e) => setForm({ ...form, montant: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select
                  value={form.mode_paiement}
                  onValueChange={(v) => setForm({ ...form, mode_paiement: v as ModePaiement })}
                  items={Object.entries(modeLabels).map(([value, label]) => ({ value, label }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(modeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {contrats.some((c) => c.en_retard) && (
        <Card className="border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Loyers en retard ce mois
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {contrats
              .filter((c) => c.en_retard)
              .map((c) => (
                <li key={c.id}>
                  {contratLabel(c.id)} — {new Intl.NumberFormat("fr-FR").format(c.loyer_mensuel)} FCFA
                </li>
              ))}
          </ul>
        </Card>
      )}

      {paiements === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : paiements.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Wallet className="h-8 w-8" />
          Aucun paiement enregistré pour l&apos;instant.
        </Card>
      ) : (
        <>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un locataire ou une période..."
            className="pl-9"
          />
        </div>
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Locataire</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Quittance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPaiements?.map((paiement) => (
                <TableRow key={paiement.id}>
                  <TableCell className="font-medium">{contratLabel(paiement.contrat_id)}</TableCell>
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
          </div>
        </Card>
        </>
      )}
    </div>
  );
}
