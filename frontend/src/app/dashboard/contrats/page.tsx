"use client";

import { useEffect, useState } from "react";
import { Plus, FileText, Download, Loader2, Archive, Search } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import type { Contrat, Locataire, Logement, StatutContrat } from "@/types";

const statutLabels: Record<StatutContrat, string> = {
  ACTIF: "Actif",
  ARCHIVE: "Archivé",
  RESILIE: "Résilié",
};

export default function ContratsPage() {
  const [contrats, setContrats] = useState<Contrat[] | null>(null);
  const [logements, setLogements] = useState<Logement[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [archiving, setArchiving] = useState<Contrat | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    logement_id: "",
    locataire_id: "",
    date_debut: "",
    loyer_mensuel: "",
    jour_paiement: "5",
    depot_garantie: "",
  });

  function load() {
    api.get<Contrat[]>("/api/contrats").then((res) => setContrats(res.data));
    api.get<Logement[]>("/api/logements").then((res) => setLogements(res.data));
    api.get<Locataire[]>("/api/locataires").then((res) => setLocataires(res.data));
  }

  useEffect(load, []);

  function logementName(id: number) {
    return logements.find((l) => l.id === id)?.nom ?? `Logement #${id}`;
  }
  function locataireName(id: number) {
    const l = locataires.find((l) => l.id === id);
    return l ? `${l.prenom} ${l.nom}` : `Locataire #${id}`;
  }

  function handleLogementChange(logementId: string | null) {
    const logement = logements.find((l) => String(l.id) === logementId);
    setForm({
      ...form,
      logement_id: logementId ?? "",
      loyer_mensuel: logement ? String(logement.loyer_mensuel) : form.loyer_mensuel,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.logement_id || !form.locataire_id) {
      toast.error("Sélectionnez un logement et un locataire");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/api/contrats", {
        logement_id: Number(form.logement_id),
        locataire_id: Number(form.locataire_id),
        date_debut: form.date_debut,
        loyer_mensuel: Number(form.loyer_mensuel),
        jour_paiement: Number(form.jour_paiement),
        depot_garantie: form.depot_garantie ? Number(form.depot_garantie) : null,
      });
      toast.success("Contrat créé et PDF généré");
      setForm({
        logement_id: "",
        locataire_id: "",
        date_debut: "",
        loyer_mensuel: "",
        jour_paiement: "5",
        depot_garantie: "",
      });
      setOpen(false);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmArchive() {
    if (!archiving) return;
    setIsArchiving(true);
    try {
      await api.patch(`/api/contrats/${archiving.id}`, { statut: "ARCHIVE" });
      toast.success("Contrat archivé");
      setArchiving(null);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsArchiving(false);
    }
  }

  const filteredContrats = contrats?.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return logementName(c.logement_id).toLowerCase().includes(q) || locataireName(c.locataire_id).toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contrats</h1>
          <p className="text-sm text-muted-foreground">Création, archivage et téléchargement des contrats.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button disabled={logements.length === 0 || locataires.length === 0} />}>
            <Plus className="mr-1 h-4 w-4" /> Nouveau contrat
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un contrat</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Logement</Label>
                <Select
                  value={form.logement_id}
                  onValueChange={handleLogementChange}
                  items={logements.map((l) => ({ value: String(l.id), label: l.nom }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un logement" />
                  </SelectTrigger>
                  <SelectContent>
                    {logements.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Locataire</Label>
                <Select
                  value={form.locataire_id}
                  onValueChange={(v) => setForm({ ...form, locataire_id: v ?? "" })}
                  items={locataires.map((l) => ({ value: String(l.id), label: `${l.prenom} ${l.nom}` }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un locataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {locataires.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.prenom} {l.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_debut">Date de début</Label>
                  <Input
                    id="date_debut"
                    type="date"
                    required
                    value={form.date_debut}
                    onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jour_paiement">Jour de paiement</Label>
                  <Input
                    id="jour_paiement"
                    type="number"
                    min={1}
                    max={28}
                    required
                    value={form.jour_paiement}
                    onChange={(e) => setForm({ ...form, jour_paiement: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loyer">Loyer mensuel (FCFA)</Label>
                  <Input
                    id="loyer"
                    type="number"
                    min={0}
                    required
                    value={form.loyer_mensuel}
                    onChange={(e) => setForm({ ...form, loyer_mensuel: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depot">Dépôt de garantie</Label>
                  <Input
                    id="depot"
                    type="number"
                    min={0}
                    value={form.depot_garantie}
                    onChange={(e) => setForm({ ...form, depot_garantie: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer le contrat
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={!!archiving} onOpenChange={(v) => !v && setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver ce contrat ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le logement redeviendra vacant. Le contrat restera consultable dans l&apos;historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} disabled={isArchiving}>
              {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {contrats === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : contrats.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <FileText className="h-8 w-8" />
          Aucun contrat pour l&apos;instant.
        </Card>
      ) : (
        <>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un logement ou un locataire..."
            className="pl-9"
          />
        </div>
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logement</TableHead>
                <TableHead>Locataire</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Loyer</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContrats?.map((contrat) => (
                <TableRow key={contrat.id}>
                  <TableCell className="font-medium">{logementName(contrat.logement_id)}</TableCell>
                  <TableCell>{locataireName(contrat.locataire_id)}</TableCell>
                  <TableCell>{contrat.date_debut}</TableCell>
                  <TableCell>{new Intl.NumberFormat("fr-FR").format(contrat.loyer_mensuel)} FCFA</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Badge variant={contrat.statut === "ACTIF" ? "default" : "secondary"}>
                      {statutLabels[contrat.statut]}
                    </Badge>
                    {contrat.en_retard && <Badge variant="destructive">En retard</Badge>}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {contrat.pdf_path && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Télécharger le PDF"
                        onClick={() => downloadWithAuth(`/api/contrats/${contrat.id}/pdf`, `contrat_${contrat.id}.pdf`)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {contrat.statut === "ACTIF" && (
                      <Button variant="outline" size="icon" onClick={() => setArchiving(contrat)} title="Archiver">
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        </>
      )}
    </div>
  );
}

async function downloadWithAuth(path: string, filename: string) {
  try {
    const res = await api.get(path, { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.error("Impossible de télécharger le document");
  }
}
