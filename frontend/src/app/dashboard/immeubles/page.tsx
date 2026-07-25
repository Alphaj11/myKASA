"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Building2, Loader2, Pencil, Trash2, Camera, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiErrorMessage, imgUrl } from "@/lib/api";
import type { Immeuble } from "@/types";

const TYPES_BIEN = ["Résidentiel", "Commercial", "Mixte", "Industriel", "Terrain"];

const DECLARATION_TEXT = `Je déclare sur l'honneur être propriétaire du bien immobilier enregistré sur cette plateforme ou être légalement autorisé à en assurer la gestion et la location.

Je certifie que les informations fournies sont exactes à ma connaissance. Je reconnais être seul responsable des informations, documents et déclarations transmis.

Je comprends que toute fausse déclaration peut engager ma responsabilité civile et/ou pénale conformément à la législation applicable.

J'autorise la plateforme à conserver les informations relatives à ce bien dans le cadre de la gestion locative et m'engage à fournir tout document complémentaire permettant de renforcer la vérification de ce bien lorsque cela sera demandé.`;

const verificationBadge = (level: number) => {
  if (level >= 3) return { label: "Bien vérifié", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
  if (level >= 2) return { label: "Documents fournis", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" };
  if (level >= 1) return { label: "Bien déclaré", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" };
  return null;
};

const emptyForm = {
  nom: "", adresse: "", ville: "", description: "",
  type_bien: "", superficie_totale: "", annee_construction: "",
  declaration_acceptee: false,
};

function PhotoButton({ immeuble, onUploaded }: { immeuble: Immeuble; onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post(`/api/immeubles/${immeuble.id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Photo enregistrée");
      onUploaded();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 flex items-center justify-center rounded-t-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
        title="Changer la photo"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        ) : (
          <Camera className="h-5 w-5 text-white" />
        )}
      </button>
    </>
  );
}

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
    setForm({
      nom: immeuble.nom,
      adresse: immeuble.adresse,
      ville: immeuble.ville,
      description: immeuble.description ?? "",
      type_bien: immeuble.type_bien ?? "",
      superficie_totale: immeuble.superficie_totale != null ? String(immeuble.superficie_totale) : "",
      annee_construction: immeuble.annee_construction != null ? String(immeuble.annee_construction) : "",
      declaration_acceptee: immeuble.declaration_acceptee,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing && !form.declaration_acceptee) {
      toast.error("Vous devez accepter la déclaration sur l'honneur");
      return;
    }
    setIsSubmitting(true);
    const payload = {
      nom: form.nom,
      adresse: form.adresse,
      ville: form.ville,
      description: form.description || null,
      type_bien: form.type_bien || null,
      superficie_totale: form.superficie_totale ? Number(form.superficie_totale) : null,
      annee_construction: form.annee_construction ? Number(form.annee_construction) : null,
      ...(editing ? {} : { declaration_acceptee: form.declaration_acceptee }),
    };
    try {
      if (editing) {
        await api.patch(`/api/immeubles/${editing.id}`, payload);
        toast.success("Immeuble mis à jour");
      } else {
        await api.post("/api/immeubles", payload);
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Immeubles</h1>
          <p className="text-sm text-muted-foreground">Gérez vos biens immobiliers et leur statut.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier l'immeuble" : "Nouvel immeuble"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="nom">Nom du bien *</Label>
                  <Input id="nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Résidence Bonapriso" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ville">Ville *</Label>
                  <Input id="ville" required value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} placeholder="Douala" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type de bien</Label>
                  <Select
                    value={form.type_bien}
                    onValueChange={(v) => setForm({ ...form, type_bien: v ?? "" })}
                    items={TYPES_BIEN.map((t) => ({ value: t, label: t }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_BIEN.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="adresse">Adresse *</Label>
                  <Input id="adresse" required value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Rue 1234, Quartier..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="superficie">Superficie totale (m²)</Label>
                  <Input id="superficie" type="number" min={0} value={form.superficie_totale} onChange={(e) => setForm({ ...form, superficie_totale: e.target.value })} placeholder="500" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="annee">Année de construction</Label>
                  <Input id="annee" type="number" min={1900} max={new Date().getFullYear()} value={form.annee_construction} onChange={(e) => setForm({ ...form, annee_construction: e.target.value })} placeholder="2010" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="desc">Description</Label>
                  <textarea
                    id="desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Immeuble R+4, gardien, parking..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
              </div>

              {!editing && (
                <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Déclaration sur l&apos;honneur</p>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{DECLARATION_TEXT}</p>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={form.declaration_acceptee}
                      onChange={(e) => setForm({ ...form, declaration_acceptee: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                    />
                    <span className="text-xs font-medium leading-snug">
                      J&apos;accepte cette déclaration sur l&apos;honneur
                    </span>
                  </label>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || (!editing && !form.declaration_acceptee)}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer les modifications" : "Enregistrer le bien"}
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
              Cette action est irréversible et supprimera aussi tous les logements associés.
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
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : immeubles.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
          <Building2 className="h-10 w-10 opacity-40" />
          <div>
            <p className="font-medium">Aucun bien immobilier</p>
            <p className="text-sm">Ajoutez votre premier immeuble pour commencer.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {immeubles.map((immeuble, i) => {
            const badge = verificationBadge(immeuble.verification_level);
            const photo = imgUrl(immeuble.photo_principale_url);
            return (
              <motion.div key={immeuble.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="overflow-hidden p-0">
                  <div className="relative h-36 group bg-accent/30">
                    {photo ? (
                      <img src={photo} alt={immeuble.nom} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2 className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <PhotoButton immeuble={immeuble} onUploaded={load} />
                    {badge && (
                      <span className={`absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    )}
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button variant="ghost" size="icon-sm" className="bg-background/80 backdrop-blur-sm hover:bg-background" onClick={() => openEdit(immeuble)} title="Modifier">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="bg-background/80 backdrop-blur-sm hover:bg-background" onClick={() => setDeleting(immeuble)} title="Supprimer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold leading-tight">{immeuble.nom}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{immeuble.adresse}, {immeuble.ville}</p>
                    {immeuble.description && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{immeuble.description}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-primary">{immeuble.nb_logements} logement(s)</span>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {immeuble.superficie_totale && <span>{immeuble.superficie_totale} m²</span>}
                        {immeuble.annee_construction && <span>{immeuble.annee_construction}</span>}
                      </div>
                    </div>
                    {immeuble.declaration_acceptee && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Déclaration signée</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
