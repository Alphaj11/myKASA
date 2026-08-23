"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  FileCheck2,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { Locataire, Logement } from "@/types";

/* ─── types locaux ─────────────────────────────────────────────────────── */

interface UtilisateurPublic {
  utilisateur_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  code_locataire: string;
}

/* ─── formulaire manuel (état par défaut) ──────────────────────────────── */

const emptyForm = {
  nom: "", prenom: "", email: "", telephone: "", logement_id: "",
  date_naissance: "", adresse: "", cni_numero: "", profession: "", employeur: "",
  lieu_naissance: "", nationalite: "", statut_matrimonial: "", nb_enfants: "",
};

/* ─── Sous-composants upload ────────────────────────────────────────────── */

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
    <div className="flex items-center gap-2 flex-wrap">
      <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileChange} />
      {locataire.piece_identite && (
        <Button variant="outline" size="sm" onClick={viewDocument} className="h-7 px-2 text-xs">
          <FileCheck2 className="mr-1 h-3.5 w-3.5" /> Voir la pièce
        </Button>
      )}
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
        {isUploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Paperclip className="mr-1 h-3.5 w-3.5" />}
        {locataire.piece_identite ? "Remplacer" : "Pièce d'identité"}
      </Button>
    </div>
  );
}

function AvatarUploadButton({ locataire, onUploaded }: { locataire: Locataire; onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post(`/api/locataires/${locataire.id}/photo`, fd, {
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
        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Camera className="h-4 w-4 text-white" />}
      </button>
    </>
  );
}

/* ─── Dialog "Par code MyKASA" ─────────────────────────────────────────── */

type CodeStep = "search" | "confirm";

function DialogParCode({
  logements,
  onSuccess,
}: {
  logements: Logement[];
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<CodeStep>("search");
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<UtilisateurPublic | null>(null);

  // formulaire contrat
  const [logementId, setLogementId] = useState("");
  const [dateEntree, setDateEntree] = useState(new Date().toISOString().slice(0, 10));
  const [loyer, setLoyer] = useState("");
  const [depot, setDepot] = useState("");
  const [jourPaiement, setJourPaiement] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setStep("search");
    setCode("");
    setFound(null);
    setLogementId("");
    setLoyer("");
    setDepot("");
    setJourPaiement("1");
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setSearching(true);
    try {
      const res = await api.get<UtilisateurPublic>(`/api/locataires/recherche/${code.trim().toUpperCase()}`);
      setFound(res.data);
      setStep("confirm");
    } catch (err) {
      toast.error(apiErrorMessage(err) ?? "Code introuvable");
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!found) return;
    setSubmitting(true);
    try {
      await api.post("/api/locataires/depuis-code", {
        code: found.code_locataire,
        logement_id: logementId ? Number(logementId) : null,
        date_entree: dateEntree || null,
        loyer_mensuel: loyer ? Number(loyer) : null,
        depot_garantie: depot ? Number(depot) : null,
        jour_paiement: Number(jourPaiement),
      });
      toast.success(`${found.full_name} ajouté avec succès`);
      reset();
      onSuccess();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const initials = found
    ? found.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "";

  if (step === "search") {
    return (
      <form onSubmit={handleSearch} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="code_input">Code MyKASA du locataire</Label>
          <Input
            id="code_input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ex. A3BX7K"
            className="font-mono text-lg tracking-widest uppercase"
            maxLength={10}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Le locataire trouve son code dans son espace Profil → "Votre code MyKASA".
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={searching || code.trim().length < 4}>
          {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Rechercher
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Carte locataire trouvé */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={imgUrl(found!.avatar_url)} />
          <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{found!.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">{found!.email}</p>
          {found!.phone && <p className="text-xs text-muted-foreground">{found!.phone}</p>}
        </div>
        <span className="font-mono text-xs text-primary font-bold">{found!.code_locataire}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Logement</Label>
          <Select value={logementId} onValueChange={(v) => setLogementId(v ?? "")} items={logements.map((l) => ({ value: String(l.id), label: l.nom }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir un logement" />
            </SelectTrigger>
            <SelectContent>
              {logements.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.nom}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date_entree">Date d&apos;entrée</Label>
          <Input id="date_entree" type="date" value={dateEntree} onChange={(e) => setDateEntree(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="jour_paiement">Jour de paiement</Label>
          <Input id="jour_paiement" type="number" min="1" max="28" value={jourPaiement} onChange={(e) => setJourPaiement(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loyer">Loyer mensuel (FCFA)</Label>
          <Input id="loyer" type="number" min="0" value={loyer} onChange={(e) => setLoyer(e.target.value)} placeholder="75 000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="depot">Dépôt de garantie</Label>
          <Input id="depot" type="number" min="0" value={depot} onChange={(e) => setDepot(e.target.value)} placeholder="Optionnel" />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setStep("search")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <Button type="submit" className="flex-1" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ajouter {found?.full_name.split(" ")[0]}
        </Button>
      </div>
    </form>
  );
}

/* ─── Dialog "Saisie manuelle" ──────────────────────────────────────────── */

function DialogManuel({
  logements,
  editing,
  form,
  setForm,
  onSubmit,
  isSubmitting,
}: {
  logements: Logement[];
  editing: Locataire | null;
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prenom">Prénom *</Label>
          <Input id="prenom" required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nom">Nom *</Label>
          <Input id="nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="telephone">Téléphone</Label>
          <Input id="telephone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="+237 6XX XXX XXX" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dob">Date de naissance</Label>
          <Input id="dob" type="date" value={form.date_naissance} onChange={(e) => setForm({ ...form, date_naissance: e.target.value })} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="adresse">Adresse</Label>
          <Input id="adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Quartier, rue..." />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="cni">N° CNI / Passeport</Label>
          <Input id="cni" value={form.cni_numero} onChange={(e) => setForm({ ...form, cni_numero: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profession">Profession</Label>
          <Input id="profession" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="employeur">Employeur</Label>
          <Input id="employeur" value={form.employeur} onChange={(e) => setForm({ ...form, employeur: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
          <Input id="lieu_naissance" value={form.lieu_naissance} onChange={(e) => setForm({ ...form, lieu_naissance: e.target.value })} placeholder="Douala" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nationalite">Nationalité</Label>
          <Input id="nationalite" value={form.nationalite} onChange={(e) => setForm({ ...form, nationalite: e.target.value })} placeholder="Camerounaise" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="statut_matrimonial">Statut matrimonial</Label>
          <Input id="statut_matrimonial" value={form.statut_matrimonial} onChange={(e) => setForm({ ...form, statut_matrimonial: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nb_enfants">Nombre d&apos;enfants</Label>
          <Input id="nb_enfants" type="number" min="0" value={form.nb_enfants} onChange={(e) => setForm({ ...form, nb_enfants: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
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
            {logements.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.nom}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {editing ? "Enregistrer les modifications" : "Créer le locataire"}
      </Button>
    </form>
  );
}

/* ─── Page principale ───────────────────────────────────────────────────── */

type DialogMode = "code" | "manuel";

export default function LocatairesPage() {
  const [locataires, setLocataires] = useState<Locataire[] | null>(null);
  const [logements, setLogements] = useState<Logement[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("code");
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
    setDialogMode("code");
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(loc: Locataire) {
    setEditing(loc);
    setDialogMode("manuel");
    setForm({
      nom: loc.nom, prenom: loc.prenom,
      email: loc.email ?? "", telephone: loc.telephone ?? "",
      logement_id: loc.logement_id ? String(loc.logement_id) : "",
      date_naissance: loc.date_naissance ?? "", adresse: loc.adresse ?? "",
      cni_numero: loc.cni_numero ?? "", profession: loc.profession ?? "",
      employeur: loc.employeur ?? "",
      lieu_naissance: loc.lieu_naissance ?? "", nationalite: loc.nationalite ?? "",
      statut_matrimonial: loc.statut_matrimonial ?? "", nb_enfants: loc.nb_enfants != null ? String(loc.nb_enfants) : "",
    });
    setOpen(true);
  }

  async function handleManuelSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      nom: form.nom, prenom: form.prenom,
      email: form.email || null, telephone: form.telephone || null,
      logement_id: form.logement_id ? Number(form.logement_id) : null,
      date_naissance: form.date_naissance || null,
      adresse: form.adresse || null, cni_numero: form.cni_numero || null,
      profession: form.profession || null, employeur: form.employeur || null,
      lieu_naissance: form.lieu_naissance || null,
      nationalite: form.nationalite || null,
      statut_matrimonial: form.statut_matrimonial || null,
      nb_enfants: form.nb_enfants ? Number(form.nb_enfants) : null,
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

  const dialogTitle = editing
    ? "Modifier le locataire"
    : dialogMode === "code"
      ? "Ajouter par code MyKASA"
      : "Ajouter manuellement";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Locataires</h1>
          <p className="text-sm text-muted-foreground">Fiches et association aux logements.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-1 h-4 w-4" /> Ajouter
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>

            {/* Sélecteur de mode — uniquement en création */}
            {!editing && (
              <div className="flex rounded-lg border border-border overflow-hidden mb-1">
                <button
                  type="button"
                  onClick={() => setDialogMode("code")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    dialogMode === "code"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Par code MyKASA
                </button>
                <button
                  type="button"
                  onClick={() => setDialogMode("manuel")}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    dialogMode === "manuel"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  Saisie manuelle
                </button>
              </div>
            )}

            {!editing && dialogMode === "code" ? (
              <DialogParCode
                logements={logements}
                onSuccess={() => { setOpen(false); load(); }}
              />
            ) : (
              <DialogManuel
                logements={logements}
                editing={editing}
                form={form}
                setForm={setForm}
                onSubmit={handleManuelSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deleting?.prenom} {deleting?.nom} ?</AlertDialogTitle>
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
        <Card className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
          <Users className="h-10 w-10 opacity-40" />
          <div>
            <p className="font-medium">Aucun locataire</p>
            <p className="text-sm">Ajoutez vos premiers locataires.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un locataire..." className="pl-9" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLocataires?.map((loc) => (
              <Card key={loc.id} className="relative p-4">
                <div className="absolute right-3 top-3 flex gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(loc)} title="Modifier"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(loc)} title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="flex items-center gap-3 pr-14">
                  <div className="relative group">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={imgUrl(loc.photo_url)} />
                      <AvatarFallback className="text-sm font-semibold">
                        {loc.prenom[0]}{loc.nom[0]}
                      </AvatarFallback>
                    </Avatar>
                    <AvatarUploadButton locataire={loc} onUploaded={load} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{loc.prenom} {loc.nom}</p>
                    <p className="text-xs text-muted-foreground truncate">{loc.email ?? "Pas d'email"}</p>
                    {loc.profession && <p className="text-xs text-muted-foreground truncate">{loc.profession}</p>}
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-primary">{logementName(loc.logement_id)}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {loc.telephone && <span>{loc.telephone}</span>}
                    {loc.cni_numero && <span>CNI: {loc.cni_numero}</span>}
                  </div>
                </div>
                <div className="mt-3 border-t pt-3">
                  <DocumentButton locataire={loc} onUploaded={load} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
