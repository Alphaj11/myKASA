"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setMessage(detail ?? "Limite de votre plan atteinte.");
      setOpen(true);
    }
    window.addEventListener("plan-limit", handler);
    return () => window.removeEventListener("plan-limit", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Limite du plan atteinte
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        <div className="mt-2 flex gap-3">
          <Link
            href="/dashboard/plan"
            onClick={() => setOpen(false)}
            className="flex-1 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Voir les plans
          </Link>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
