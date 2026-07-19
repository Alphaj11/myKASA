"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiErrorMessage } from "@/lib/api";
import type { Immeuble } from "@/types";

const emptyForm = { nom: "", adresse: "", ville: "" };

export default function ImmeublesPage() {
  const [immeubles, setImmeubles] = useState<Immeuble[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Immeuble | null>(null);
  const [deleting, setDeleting] = useState<Immeuble | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function load() {
    api.get<Immeuble[]>("/api/immeubles").then((res) => setImmeubles(res.data));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(immeuble: Immeuble) {
    setEditing(immeuble);
    setForm({ nom: immeuble.nom, adresse: immeuble.adresse, ville: immeuble.ville });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editing) {
        await api.patch(`/api/immeubles/${editing.id}`, form);
        toast.success("Immeuble mis à jour");
      } else {
        await api.post("/api/immeubles", form);
        toast.success("Immeuble ajouté");
      }
      setOpen(false);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/immeubles/${deleting.id}`);
      toast.success("Immeuble supprimé");
      setDeleting(null);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Immeubles</h1>
          <p className="text-sm text-muted-foreground">Gérez vos immeubles et leur adresse.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter un immeuble
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier l'immeuble" : "Nouvel immeuble"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  required
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Résidence Bonapriso"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  required
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  placeholder="Rue 1234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ville">Ville</Label>
                <Input
                  id="ville"
                  required
                  value={form.ville}
                  onChange={(e) => setForm({ ...form, ville: e.target.value })}
                  placeholder="Douala"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer les modifications" : "Créer l'immeuble"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deleting?.nom} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera aussi les logements associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {immeubles === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : immeubles.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Building2 className="h-8 w-8" />
          Aucun immeuble pour l&apos;instant. Ajoutez le premier.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {immeubles.map((immeuble, i) => (
            <motion.div
              key={immeuble.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="relative p-5">
                <div className="absolute right-3 top-3 flex gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(immeuble)} title="Modifier">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleting(immeuble)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Building2 className="h-5 w-5" />
                </span>
                <h3 className="mt-3 pr-14 font-semibold">{immeuble.nom}</h3>
                <p className="text-sm text-muted-foreground">
                  {immeuble.adresse}, {immeuble.ville}
                </p>
                <p className="mt-3 text-xs font-medium text-primary">
                  {immeuble.nb_logements} logement(s)
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
