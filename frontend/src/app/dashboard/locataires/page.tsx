"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Users, Loader2, Pencil, Trash2, Search, Paperclip, FileCheck2 } from "lucide-react";
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
import type { Locataire, Logement } from "@/types";

const emptyForm = { nom: "", prenom: "", email: "", telephone: "", logement_id: "" };

function DocumentButton({ locataire, onUploaded }: { locataire: Locataire; onUploaded: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post(`/api/locataires/${locataire.id}/document`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document enregistré");
      onUploaded();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  async function viewDocument() {
    try {
      const res = await api.get(`/api/locataires/${locataire.id}/document`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      window.open(url, "_blank");
    } catch {
      toast.error("Impossible d'ouvrir le document");
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
      {locataire.piece_identite ? (
        <Button variant="outline" size="sm" onClick={viewDocument} className="h-7 px-2 text-xs">
          <FileCheck2 className="mr-1 h-3.5 w-3.5" /> Voir le document
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Paperclip className="mr-1 h-3.5 w-3.5" />}
        {locataire.piece_identite ? "Remplacer" : "Ajouter une pièce d'identité"}
      </Button>
    </div>
  );
}

export default function LocatairesPage() {
  const [locataires, setLocataires] = useState<Locataire[] | null>(null);
  const [logements, setLogements] = useState<Logement[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Locataire | null>(null);
  const [deleting, setDeleting] = useState<Locataire | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  function load() {
    api.get<Locataire[]>("/api/locataires").then((res) => setLocataires(res.data));
    api.get<Logement[]>("/api/logements").then((res) => setLogements(res.data));
  }

  useEffect(load, []);

  function logementName(id: number | null) {
    if (!id) return "Aucun logement";
    return logements.find((l) => l.id === id)?.nom ?? `Logement #${id}`;
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(locataire: Locataire) {
    setEditing(locataire);
    setForm({
      nom: locataire.nom,
      prenom: locataire.prenom,
      email: locataire.email ?? "",
      telephone: locataire.telephone ?? "",
      logement_id: locataire.logement_id ? String(locataire.logement_id) : "",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      nom: form.nom,
      prenom: form.prenom,
      email: form.email || null,
      telephone: form.telephone || null,
      logement_id: form.logement_id ? Number(form.logement_id) : null,
    };
    try {
      if (editing) {
        await api.patch(`/api/locataires/${editing.id}`, payload);
        toast.success("Locataire mis à jour");
      } else {
        await api.post("/api/locataires", payload);
        toast.success("Locataire ajouté");
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
      await api.delete(`/api/locataires/${deleting.id}`);
      toast.success("Locataire supprimé");
      setDeleting(null);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredLocataires = locataires?.filter((l) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${l.prenom} ${l.nom}`.toLowerCase().includes(q) || (l.email ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Locataires</h1>
          <p className="text-sm text-muted-foreground">Fiches et association aux logements.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter un locataire
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier le locataire" : "Nouveau locataire"}</DialogTitle>
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
                {editing ? "Enregistrer les modifications" : "Créer le locataire"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {deleting?.prenom} {deleting?.nom} ?
            </AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
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

      {locataires === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : locataires.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Users className="h-8 w-8" />
          Aucun locataire pour l&apos;instant.
        </Card>
      ) : (
        <>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un locataire..."
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLocataires?.map((locataire) => (
            <Card key={locataire.id} className="relative p-5">
              <div className="absolute right-3 top-3 flex gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => openEdit(locataire)} title="Modifier">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleting(locataire)}
                  title="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-3 pr-14">
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
              <DocumentButton locataire={locataire} onUploaded={load} />
            </Card>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
