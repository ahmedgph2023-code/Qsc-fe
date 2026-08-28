import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-6 text-foreground">
      <div className="terminal-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -start-24 top-0 h-[24rem] w-[24rem] rounded-full bg-maroon/15 blur-3xl" />
      <div className="pointer-events-none absolute -end-16 bottom-0 h-[20rem] w-[20rem] rounded-full bg-gold/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/70 bg-card/80 p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.12)] backdrop-blur-xl animate-in dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-card">
          <BrandLogo variant="mark" className="h-12 w-12 object-contain" decorative />
        </div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-gold">{t("notFound.code")}</p>
        <h1 className="display-font mb-3 text-3xl tracking-tight">{t("notFound.title")}</h1>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          {t("notFound.description")}
        </p>
        <Button asChild className="mt-8 w-full" size="lg">
          <Link href="/">
            <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
            {t("notFound.back")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
