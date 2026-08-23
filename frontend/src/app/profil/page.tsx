"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Copy, Crown, Loader2, Moon, ShieldCheck, Sun, SunMoon, User } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { api, apiErrorMessage, imgUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { PlanUsage } from "@/types";

export default function ProfilPage() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [adresse, setAdresse] = useState("");
  const [cniNumero, setCniNumero] = useState("");
  const [cniDateDelivrance, setCniDateDelivrance] = useState("");
  const [cniLieuDelivrance, setCniLieuDelivrance] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone ?? "");
      setDateNaissance(user.date_naissance ?? "");
      setAdresse(user.adresse ?? "");
      setCniNumero(user.cni_numero ?? "");
      setCniDateDelivrance(user.cni_date_delivrance ?? "");
      setCniLieuDelivrance(user.cni_lieu_delivrance ?? "");
      if (user.role === "BAILLEUR" || user.role === "GESTIONNAIRE") {
        api.get<PlanUsage>("/api/auth/me/plan").then((r) => setPlanUsage(r.data)).catch(() => {});
      }
    }
  }, [user]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post("/api/auth/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUser();
      toast.success("Photo de profil mise à jour");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.patch("/api/auth/me", {
        full_name: fullName,
        phone: phone || null,
        date_naissance: dateNaissance || null,
        adresse: adresse || null,
        cni_numero: cniNumero || null,
        cni_date_delivrance: cniDateDelivrance || null,
        cni_lieu_delivrance: cniLieuDelivrance || null,
      });
      await refreshUser();
      toast.success("Profil mis à jour");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas");
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.post("/api/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Mot de passe mis à jour");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSavingPassword(false);
    }
  }

  function copyCode() {
    if (!user?.code_locataire) return;
    navigator.clipboard.writeText(user.code_locataire);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  if (!user) return null;

  const hasIdentity = user.full_name && (user.date_naissance || user.cni_numero || user.adresse);
  const initials = user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-sm text-muted-foreground">Vos informations personnelles et votre sécurité.</p>
      </div>

      {/* Code MyKASA — visible pour tous, indispensable pour le locataire */}
      {user.code_locataire && (
        <Card className="p-5 border-primary/30 bg-primary/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                Votre code MyKASA
              </p>
              <p className="text-3xl font-mono font-bold tracking-widest">{user.code_locataire}</p>
              {user.role === "LOCATAIRE" && (
                <p className="mt-1.5 text-xs text-muted-foreground max-w-xs">
                  Transmettez ce code à votre propriétaire pour qu&apos;il puisse vous ajouter à un logement sans ressaisir vos informations.
                </p>
              )}
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent transition-colors shrink-0"
            >
              {codeCopied ? (
                <><Check className="h-3.5 w-3.5 text-accent-foreground" /> Copié</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copier</>
              )}
            </button>
          </div>
        </Card>
      )}

      {/* Usage du plan — bailleurs et gestionnaires */}
      {planUsage && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-semibold">
                Plan <span className="text-primary">{planUsage.plan_label}</span>
              </span>
            </div>
            <Link
              href="/dashboard/plan"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              Voir les plans
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Propriétés", data: planUsage.immeubles },
              { label: "Logements", data: planUsage.logements },
            ].map(({ label, data }) => {
              const atLimit = data.max !== null && data.current >= data.max;
              const pct = data.max === null ? 0 : Math.min((data.current / data.max) * 100, 100);
              return (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={atLimit ? "text-destructive font-semibold" : ""}>
                      {data.current} / {data.max === null ? "∞" : data.max}
                    </span>
                  </div>
                  {data.max !== null && (
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${atLimit ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Carte d'identité */}
      {hasIdentity && (
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-r from-primary to-primary/70 p-4">
            <div className="flex items-center gap-2 text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Carte de membre MyKASA</span>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="relative group shrink-0">
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage src={imgUrl(user.avatar_url)} />
                  <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm flex-1">
                <div>
                  <p className="text-xs text-muted-foreground">Nom complet</p>
                  <p className="font-semibold">{user.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rôle</p>
                  <p className="font-semibold capitalize">{user.role.toLowerCase()}</p>
                </div>
                {user.date_naissance && (
                  <div>
                    <p className="text-xs text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">{new Date(user.date_naissance).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
                {user.cni_numero && (
                  <div>
                    <p className="text-xs text-muted-foreground">N° CNI</p>
                    <p className="font-medium">{user.cni_numero}</p>
                  </div>
                )}
                {user.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                )}
                {user.adresse && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="font-medium">{user.adresse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Photo de profil (si pas encore de carte) */}
      {!hasIdentity && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={imgUrl(user.avatar_url)} />
                <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {uploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
              </button>
            </div>
            <div>
              <p className="font-semibold">{user.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Complétez vos informations ci-dessous pour générer votre carte de membre.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Formulaire infos personnelles */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Informations personnelles</h2>
        </div>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date de naissance</Label>
              <Input id="dob" type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cni">N° CNI / Passeport</Label>
              <Input id="cni" value={cniNumero} onChange={(e) => setCniNumero(e.target.value)} placeholder="123456789" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cni_date">Date de délivrance CNI</Label>
              <Input id="cni_date" type="date" value={cniDateDelivrance} onChange={(e) => setCniDateDelivrance(e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="cni_lieu">Lieu de délivrance CNI</Label>
              <Input id="cni_lieu" value={cniLieuDelivrance} onChange={(e) => setCniLieuDelivrance(e.target.value)} placeholder="Yaoundé, préfecture de..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Quartier, ville..." />
            </div>
          </div>
          <Button type="submit" disabled={isSavingProfile}>
            {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </form>
      </Card>

      {/* Thème */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Apparence</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", label: "Clair", icon: Sun },
            { value: "dark", label: "Sombre", icon: Moon },
            { value: "system", label: "Système", icon: SunMoon },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors ${
                theme === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Changement mot de passe */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Changer le mot de passe</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current_password">Mot de passe actuel</Label>
            <Input id="current_password" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="new_password">Nouveau</Label>
              <Input id="new_password" type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_new_password">Confirmer</Label>
              <Input id="confirm_new_password" type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={isSavingPassword}>
            {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Changer le mot de passe
          </Button>
        </form>
      </Card>
    </div>
  );
}
