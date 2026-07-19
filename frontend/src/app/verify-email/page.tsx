"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, apiErrorMessage } from "@/lib/api";
import { homeForRole, useAuth } from "@/lib/auth-context";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Ce lien de vérification est invalide ou incomplet.");
      return;
    }
    api
      .post("/api/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((error) => {
        setStatus("error");
        setMessage(apiErrorMessage(error));
      });
  }, [token]);

  return (
    <Card className="flex flex-col items-center gap-3 p-6 py-10 text-center">
      {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
      {status === "success" && (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <h1 className="text-lg font-bold">Email vérifié</h1>
          <p className="text-sm text-muted-foreground">Votre adresse email a été confirmée avec succès.</p>
          <Button className="mt-2" render={<Link href={user ? homeForRole(user.role) : "/login"} />}>
            Continuer
          </Button>
        </>
      )}
      {status === "error" && (
        <>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="h-6 w-6" />
          </span>
          <h1 className="text-lg font-bold">Lien invalide</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </>
      )}
    </Card>
  );
}

export default function VerifyEmailPage() {
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
          <VerifyEmailContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
