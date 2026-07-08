"use client";

import { useEffect, useState } from "react";
import { Plus, Home, Loader2 } from "lucide-react";
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
import type { Immeuble, Logement, TypeLogement } from "@/types";

const typeLabels: Record<TypeLogement, string> = {
  STUDIO: "Studio",
  APPARTEMENT: "Appartement",
  MAISON: "Maison",
  CHAMBRE: "Chambre",
};

export default function LogementsPage() {
  const [logements, setLogements] = useState<Logement[] | null>(null);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    type: "APPARTEMENT" as TypeLogement,
    loyer_mensuel: "",
    immeuble_id: "",
  });

  function load() {
    api.get<Logement[]>("/api/logements").then((res) => setLogements(res.data));
    api.get<Immeuble[]>("/api/immeubles").then((res) => setImmeubles(res.data));
  }

  useEffect(load, []);

  function immeubleName(id: number) {
    return immeubles.find((i) => i.id === id)?.nom ?? `Immeuble #${id}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.immeuble_id) {
      toast.error("Sélectionnez un immeuble");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/api/logements", {
        nom: form.nom,
        type: form.type,
        loyer_mensuel: Number(form.loyer_mensuel),
        immeuble_id: Number(form.immeuble_id),
      });
      toast.success("Logement ajouté");
      setForm({ nom: "", type: "APPARTEMENT", loyer_mensuel: "", immeuble_id: "" });
      setOpen(false);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logements</h1>
          <p className="text-sm text-muted-foreground">Occupation et disponibilité de vos logements.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button disabled={immeubles.length === 0} />}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter un logement
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau logement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Immeuble</Label>
                <Select
                  value={form.immeuble_id}
                  onValueChange={(v) => setForm({ ...form, immeuble_id: v ?? "" })}
                  items={immeubles.map((i) => ({ value: String(i.id), label: i.nom }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un immeuble" />
                  </SelectTrigger>
                  <SelectContent>
                    {immeubles.map((i) => (
                      <SelectItem key={i.id} value={String(i.id)}>
                        {i.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom / numéro</Label>
                <Input
                  id="nom"
                  required
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Appt A1"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as TypeLogement })}
                  items={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loyer">Loyer mensuel (FCFA)</Label>
                <Input
                  id="loyer"
                  type="number"
                  min={0}
                  required
                  value={form.loyer_mensuel}
                  onChange={(e) => setForm({ ...form, loyer_mensuel: e.target.value })}
                  placeholder="150000"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer le logement
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {logements === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : logements.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Home className="h-8 w-8" />
          Aucun logement pour l&apos;instant.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logement</TableHead>
                <TableHead>Immeuble</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Loyer</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logements.map((logement) => (
                <TableRow key={logement.id}>
                  <TableCell className="font-medium">{logement.nom}</TableCell>
                  <TableCell>{immeubleName(logement.immeuble_id)}</TableCell>
                  <TableCell>{typeLabels[logement.type]}</TableCell>
                  <TableCell>{new Intl.NumberFormat("fr-FR").format(logement.loyer_mensuel)} FCFA</TableCell>
                  <TableCell>
                    <Badge variant={logement.statut === "OCCUPE" ? "default" : "secondary"}>
                      {logement.statut === "OCCUPE" ? "Occupé" : "Vacant"}
                    </Badge>
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
