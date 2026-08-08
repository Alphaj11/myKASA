"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Home, Loader2, Pencil, Trash2, Search, Camera } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { api, apiErrorMessage, imgUrl } from "@/lib/api";
import type { Immeuble, Logement, StatutLogement, TypeLogement } from "@/types";

const typeLabels: Record<TypeLogement, string> = {
  STUDIO: "Studio",
  APPARTEMENT: "Appartement",
  MAISON: "Maison",
  CHAMBRE: "Chambre",
  VILLA: "Villa",
  BUREAU: "Bureau",
};

// Which logement types are allowed inside each property type
const TYPES_COMPATIBLES: Record<string, TypeLogement[]> = {
  "Immeuble":         ["STUDIO", "APPARTEMENT", "CHAMBRE", "BUREAU"],
  "Résidence":        ["VILLA", "MAISON", "APPARTEMENT", "STUDIO", "CHAMBRE"],
  "Maison":           ["CHAMBRE"],
  "Villa":            ["CHAMBRE"],
  "Local commercial": ["BUREAU"],
  "Entrepôt":         ["BUREAU"],
};

const ALL_TYPES = Object.keys(typeLabels) as TypeLogement[];

const statutLabels: Record<StatutLogement, string> = {
  VACANT: "Vacant",
  OCCUPE: "Occupé",
};

const emptyForm = {
  nom: "",
  type: "APPARTEMENT" as TypeLogement,
  loyer_mensuel: "",
  immeuble_id: "",
  statut: "VACANT" as StatutLogement,
  description: "",
  superficie: "",
  etage: "",
  nb_chambres: "",
  nb_salles_de_bain: "",
  meuble: false,
};

function PhotoButton({ logement, onUploaded }: { logement: Logement; onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post(`/api/logements/${logement.id}/photo`, fd, {
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
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        title="Changer la photo"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        {logement.photo_principale_url ? "Changer la photo" : "Ajouter une photo"}
      </button>
    </>
  );
}

export default function LogementsPage() {
  const [logements, setLogements] = useState<Logement[] | null>(null);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Logement | null>(null);
  const [deleting, setDeleting] = useState<Logement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  function load() {
    api.get<Logement[]>("/api/logements").then((res) => setLogements(res.data));
    api.get<Immeuble[]>("/api/immeubles").then((res) => setImmeubles(res.data));
  }

  useEffect(load, []);

  function immeubleName(id: number) {
    return immeubles.find((i) => i.id === id)?.nom ?? `Immeuble #${id}`;
  }

  const selectedImmeuble = immeubles.find((i) => String(i.id) === form.immeuble_id);
  const allowedTypes: TypeLogement[] = selectedImmeuble?.type_bien
    ? (TYPES_COMPATIBLES[selectedImmeuble.type_bien] ?? ALL_TYPES)
    : ALL_TYPES;
  const isBureau = form.type === "BUREAU";

  const filteredLogements = logements?.filter((l) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return l.nom.toLowerCase().includes(q) || immeubleName(l.immeuble_id).toLowerCase().includes(q);
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(logement: Logement) {
    setEditing(logement);
    setForm({
      nom: logement.nom,
      type: logement.type,
      loyer_mensuel: String(logement.loyer_mensuel),
      immeuble_id: String(logement.immeuble_id),
      statut: logement.statut,
      description: logement.description ?? "",
      superficie: logement.superficie != null ? String(logement.superficie) : "",
      etage: logement.etage != null ? String(logement.etage) : "",
      nb_chambres: logement.nb_chambres != null ? String(logement.nb_chambres) : "",
      nb_salles_de_bain: logement.nb_salles_de_bain != null ? String(logement.nb_salles_de_bain) : "",
      meuble: logement.meuble,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing && !form.immeuble_id) {
      toast.error("Sélectionnez une propriété");
      return;
    }
    if (form.superficie && selectedImmeuble?.superficie_totale) {
      if (Number(form.superficie) > selectedImmeuble.superficie_totale) {
        toast.error(`Superficie trop grande — la propriété fait ${selectedImmeuble.superficie_totale} m² au total`);
        return;
      }
    }
    setIsSubmitting(true);
    const payload = {
      nom: form.nom,
      type: form.type,
      loyer_mensuel: Number(form.loyer_mensuel),
      description: form.description || null,
      superficie: form.superficie ? Number(form.superficie) : null,
      etage: form.etage !== "" ? Number(form.etage) : null,
      nb_chambres: form.nb_chambres ? Number(form.nb_chambres) : null,
      nb_salles_de_bain: isBureau ? null : (form.nb_salles_de_bain ? Number(form.nb_salles_de_bain) : null),
      meuble: isBureau ? false : form.meuble,
      ...(editing ? { statut: form.statut } : { immeuble_id: Number(form.immeuble_id) }),
    };
    try {
      if (editing) {
        await api.patch(`/api/logements/${editing.id}`, payload);
        toast.success("Logement mis à jour");
      } else {
        await api.post("/api/logements", payload);
        toast.success("Logement ajouté");
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
      await api.delete(`/api/logements/${deleting.id}`);
      toast.success("Logement supprimé");
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
          <h1 className="text-2xl font-bold">Logements</h1>
          <p className="text-sm text-muted-foreground">Appartements, studios et autres unités.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button disabled={immeubles.length === 0} onClick={openCreate} />}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier le logement" : "Nouveau logement"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editing && (
                <div className="space-y-1.5">
                  <Label>Immeuble *</Label>
                  <Select
                    value={form.immeuble_id}
                    onValueChange={(v) => {
                      const newImmeuble = immeubles.find((i) => String(i.id) === v);
                      const newAllowed: TypeLogement[] = newImmeuble?.type_bien
                        ? (TYPES_COMPATIBLES[newImmeuble.type_bien] ?? ALL_TYPES)
                        : ALL_TYPES;
                      const typeOk = newAllowed.includes(form.type);
                      setForm({ ...form, immeuble_id: v ?? "", type: typeOk ? form.type : newAllowed[0] });
                    }}
                    items={immeubles.map((i) => ({ value: String(i.id), label: i.nom }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choisir un immeuble" />
                    </SelectTrigger>
                    <SelectContent>
                      {immeubles.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="nom">Nom / numéro *</Label>
                  <Input id="nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Appartement A1" />
                </div>
                <div className="space-y-1.5">
                  <Label>Type *</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as TypeLogement, nb_chambres: "", nb_salles_de_bain: "" })}
                    items={allowedTypes.map((v) => ({ value: v, label: typeLabels[v] }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedTypes.map((v) => (
                        <SelectItem key={v} value={v}>{typeLabels[v]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loyer">Loyer (FCFA) *</Label>
                  <Input id="loyer" type="number" min={0} required value={form.loyer_mensuel} onChange={(e) => setForm({ ...form, loyer_mensuel: e.target.value })} placeholder="150000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="superficie">Superficie (m²)</Label>
                  <Input id="superficie" type="number" min={0} value={form.superficie} onChange={(e) => setForm({ ...form, superficie: e.target.value })} placeholder="45" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="etage">Étage</Label>
                  <Input id="etage" type="number" min={0} value={form.etage} onChange={(e) => setForm({ ...form, etage: e.target.value })} placeholder="2" />
                </div>
                {isBureau ? (
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="nb_pieces">Nombre de pièces</Label>
                    <Input id="nb_pieces" type="number" min={0} value={form.nb_chambres} onChange={(e) => setForm({ ...form, nb_chambres: e.target.value })} placeholder="4" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="chambres">Chambres</Label>
                      <Input id="chambres" type="number" min={0} value={form.nb_chambres} onChange={(e) => setForm({ ...form, nb_chambres: e.target.value })} placeholder="2" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sdb">Salles de bain</Label>
                      <Input id="sdb" type="number" min={0} value={form.nb_salles_de_bain} onChange={(e) => setForm({ ...form, nb_salles_de_bain: e.target.value })} placeholder="1" />
                    </div>
                  </>
                )}
              </div>
              {!isBureau && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.meuble} onChange={(e) => setForm({ ...form, meuble: e.target.checked })} className="h-4 w-4 rounded accent-primary" />
                  <span className="text-sm">Logement meublé</span>
                </label>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="desc">Description</Label>
                <textarea
                  id="desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Beau séjour, cuisine équipée, balcon..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
              {editing && (
                <div className="space-y-1.5">
                  <Label>Statut</Label>
                  <Select
                    value={form.statut}
                    onValueChange={(v) => setForm({ ...form, statut: v as StatutLogement })}
                    items={Object.entries(statutLabels).map(([value, label]) => ({ value, label }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statutLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer les modifications" : "Créer le logement"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deleting?.nom} ?</AlertDialogTitle>
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

      {logements === null ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : logements.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
          <Home className="h-10 w-10 opacity-40" />
          <div>
            <p className="font-medium">Aucun logement</p>
            <p className="text-sm">Ajoutez vos premiers logements dans un immeuble existant.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="pl-9" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLogements?.map((logement) => {
              const photo = imgUrl(logement.photo_principale_url);
              return (
                <Card key={logement.id} className="overflow-hidden p-0">
                  <div className="relative h-32 bg-accent/30">
                    {photo ? (
                      <img src={photo} alt={logement.nom} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Home className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute right-2 top-2 flex gap-1">
                      <Button variant="ghost" size="icon-sm" className="bg-background/80 backdrop-blur-sm hover:bg-background" onClick={() => openEdit(logement)} title="Modifier">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="bg-background/80 backdrop-blur-sm hover:bg-background" onClick={() => setDeleting(logement)} title="Supprimer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Badge
                      variant={logement.statut === "OCCUPE" ? "default" : "secondary"}
                      className="absolute bottom-2 left-2"
                    >
                      {statutLabels[logement.statut]}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold leading-tight">{logement.nom}</h3>
                        <p className="text-xs text-muted-foreground">{immeubleName(logement.immeuble_id)} · {typeLabels[logement.type]}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-primary">
                        {new Intl.NumberFormat("fr-FR").format(logement.loyer_mensuel)} F
                      </span>
                    </div>
                    {logement.description && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{logement.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {logement.superficie && <span>{logement.superficie} m²</span>}
                      {logement.nb_chambres != null && (
                        <span>{logement.nb_chambres} {logement.type === "BUREAU" ? "pièces" : "ch."}</span>
                      )}
                      {logement.type !== "BUREAU" && logement.nb_salles_de_bain != null && <span>{logement.nb_salles_de_bain} sdb</span>}
                      {logement.etage != null && <span>Ét. {logement.etage}</span>}
                      {logement.meuble && <span className="text-primary">Meublé</span>}
                    </div>
                    <div className="mt-3">
                      <PhotoButton logement={logement} onUploaded={load} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
