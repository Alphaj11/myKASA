"use client";

import { useEffect, useState } from "react";
import { Plus, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiErrorMessage } from "@/lib/api";
import type { Locataire, Logement } from "@/types";

export default function LocatairesPage() {
  const [locataires, setLocataires] = useState<Locataire[] | null>(null);
  const [logements, setLogements] = useState<Logement[]>([]);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    logement_id: "",
  });

  function load() {
    api.get<Locataire[]>("/api/locataires").then((res) => setLocataires(res.data));
    api.get<Logement[]>("/api/logements").then((res) => setLogements(res.data));
  }

  useEffect(load, []);

  function logementName(id: number | null) {
    if (!id) return "Aucun logement";
    return logements.find((l) => l.id === id)?.nom ?? `Logement #${id}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/api/locataires", {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email || null,
        telephone: form.telephone || null,
        logement_id: form.logement_id ? Number(form.logement_id) : null,
      });
      toast.success("Locataire ajouté");
      setForm({ nom: "", prenom: "", email: "", telephone: "", logement_id: "" });
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
          <h1 className="text-2xl font-bold">Locataires</h1>
          <p className="text-sm text-muted-foreground">Fiches et association aux logements.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter un locataire
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau locataire</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    required
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    required
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Logement (optionnel)</Label>
                <Select
                  value={form.logement_id}
                  onValueChange={(v) => setForm({ ...form, logement_id: v ?? "" })}
                  items={logements.map((l) => ({ value: String(l.id), label: l.nom }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Aucun logement" />
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer le locataire
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {locataires === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : locataires.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Users className="h-8 w-8" />
          Aucun locataire pour l&apos;instant.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locataires.map((locataire) => (
            <Card key={locataire.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {locataire.prenom[0]}
                    {locataire.nom[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {locataire.prenom} {locataire.nom}
                  </p>
                  <p className="text-xs text-muted-foreground">{locataire.email ?? "Pas d'email"}</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-primary">{logementName(locataire.logement_id)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
