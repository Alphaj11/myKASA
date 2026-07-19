"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function ProfilPage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await api.patch("/api/auth/me", { full_name: fullName, phone: phone || null });
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

  if (!user) return null;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil</h1>
        <p className="text-sm text-muted-foreground">Vos informations personnelles et votre sécurité.</p>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold">Informations personnelles</h2>
        <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 6XX XXX XXX"
            />
          </div>
          <Button type="submit" disabled={isSavingProfile}>
            {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold">Changer le mot de passe</h2>
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Mot de passe actuel</Label>
            <Input
              id="current_password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="new_password">Nouveau mot de passe</Label>
            <Input
              id="new_password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_new_password">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirm_new_password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
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
