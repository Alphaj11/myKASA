"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { api, apiErrorMessage } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, new_password: password });
      toast.success("Mot de passe mis à jour, vous pouvez vous connecter");
      router.push("/login");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="p-6 text-center text-sm text-muted-foreground">
        Ce lien de réinitialisation est invalide ou incomplet. Demandez-en un nouveau depuis la page{" "}
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          mot de passe oublié
        </Link>
        .
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
      <p className="mt-1 text-sm text-muted-foreground">Choisissez un nouveau mot de passe pour votre compte.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 caractères minimum"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
          <Input
            id="confirm_password"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Réinitialiser le mot de passe
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_50%_-10%,var(--accent)_0%,transparent_50%)] px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-bold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          LocalTrack
        </Link>
        <Suspense fallback={<Card className="p-6"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></Card>}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
