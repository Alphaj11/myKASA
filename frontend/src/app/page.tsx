"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  FileText,
  Wallet,
  Receipt,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const painPoints = [
  "Loyers en retard difficiles à suivre",
  "Aucune preuve fiable des paiements",
  "Contrats mal rédigés ou perdus",
  "Quittances rarement générées",
  "Gestion compliquée depuis l'étranger",
  "Aucun historique locatif fiable",
];

const features = [
  {
    icon: Building2,
    title: "Gestion des biens",
    description: "Propriétés, logements et disponibilité centralisés en un seul endroit.",
  },
  {
    icon: FileText,
    title: "Contrats numériques",
    description: "Créez, archivez et téléchargez vos contrats de location en PDF.",
  },
  {
    icon: Wallet,
    title: "Suivi des paiements",
    description: "Historique complet des loyers encaissés et alertes sur les retards.",
  },
  {
    icon: Receipt,
    title: "Quittances automatiques",
    description: "Générées instantanément à chaque paiement enregistré.",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord",
    description: "Loyers encaissés, logements vacants et retards en un coup d'œil.",
  },
  {
    icon: ShieldCheck,
    title: "Confiance & traçabilité",
    description: "Chaque logement et chaque locataire construisent leur mémoire numérique.",
  },
];

const plans = [
  {
    name: "Gratuit",
    price: "0 FCFA",
    tagline: "Pour débuter et tester MyKASA",
    features: [
      "1 propriété",
      "2 logements au total",
      "Contrats & quittances PDF",
      "Code MyKASA locataire",
    ],
  },
  {
    name: "Premium",
    price: "3 000 FCFA / mois",
    tagline: "Pour les bailleurs actifs",
    highlighted: true,
    features: [
      "3 propriétés",
      "Logements illimités par propriété",
      "Paiement loyer via CinetPay",
      "Système de points locataire",
      "Rappels SMS automatiques",
      "Export financier PDF",
    ],
  },
  {
    name: "Agence",
    price: "15 000 FCFA / mois",
    tagline: "Pour les gestionnaires professionnels",
    features: [
      "Propriétés & logements illimités",
      "Gestion multi-bailleurs",
      "Portail propriétaire dédié",
      "Quittances à votre logo",
      "Rapport fiscal annuel",
      "Support prioritaire",
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <div className="flex-1 overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <img src="/logo.png" alt="MyKASA" className="h-10 w-auto" />
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#fonctionnalites" className="hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#tarifs" className="hover:text-foreground transition-colors">
              Tarifs
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
              Connexion
            </Button>
            <Button nativeButton={false} render={<Link href="/register" />}>
              Commencer <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_-10%,var(--accent)_0%,transparent_55%),radial-gradient(circle_at_90%_10%,var(--accent)_0%,transparent_45%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              La référence de la gestion locative en Afrique
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">
              La gestion locative,{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                enfin simplifiée.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Fini les cahiers, les reçus papier et les échanges WhatsApp. MyKASA centralise
              vos propriétés, contrats, paiements et quittances dans un espace numérique sécurisé.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
                Créer mon compte bailleur <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/login" />}>
                J&apos;ai déjà un compte
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Card className="border-primary/20 p-6 shadow-2xl shadow-primary/10">
                <p className="text-sm font-medium text-muted-foreground">Tableau de bord</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {[
                    { label: "Loyers encaissés", value: "1 350 000 FCFA", color: "text-primary" },
                    { label: "Logements occupés", value: "18 / 20", color: "text-emerald-500" },
                    { label: "Retards", value: "2 contrats", color: "text-amber-500" },
                    { label: "Locataires", value: "24", color: "text-foreground" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border border-border/60 bg-muted/40 p-4">
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className={`mt-1 text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-6 -left-6 hidden rounded-xl border border-border bg-card p-3 shadow-xl sm:block"
            >
              <div className="flex items-center gap-2 text-sm">
                <Receipt className="h-4 w-4 text-primary" />
                Quittance générée
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center text-2xl font-bold md:text-3xl"
          >
            Les problèmes que vous connaissez déjà
          </motion.h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {painPoints.map((point, i) => (
              <motion.div
                key={point}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-card px-4 py-3"
              >
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-destructive" />
                <span className="text-sm text-muted-foreground">{point}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold">Un dossier numérique pour chaque bien et chaque locataire</h2>
          <p className="mt-3 text-muted-foreground">
            MyKASA ne gère pas que des logements : elle crée une mémoire numérique durable pour
            vos biens et vos locataires.
          </p>
        </motion.div>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="h-full p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="tarifs" className="border-t border-border/60 bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center text-3xl font-bold"
          >
            Une offre pour chaque bailleur
          </motion.h2>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`h-full p-6 ${
                    plan.highlighted ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary" : ""
                  }`}
                >
                  {plan.highlighted && (
                    <span className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Populaire
                    </span>
                  )}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  <p className="mt-4 text-2xl font-extrabold">{plan.price}</p>
                  <ul className="mt-6 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    nativeButton={false} render={<Link href="/register" />}
                  >
                    Choisir {plan.name}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} MyKASA. L&apos;infrastructure numérique de la location en Afrique.</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground">
              Connexion
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Inscription
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
