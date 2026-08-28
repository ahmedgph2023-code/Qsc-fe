import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Check, Eye, EyeOff, Lock, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { motion, useReducedMotion } from "framer-motion";

const REMEMBER_KEY = "qsc-login-username";

const AUTH_WIDTH = "w-full max-w-[min(100%,510px)]";

const exploreEase = [0.22, 1, 0.36, 1] as const;

function ExploreWords({
  text,
  className,
  delay = 0,
  wordClassName,
}: {
  text: string;
  className?: string;
  delay?: number;
  wordClassName?: string;
}) {
  const reduceMotion = useReducedMotion();
  const words = text.split(" ");

  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <motion.span
      className={cn("inline", className)}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.045, delayChildren: delay },
        },
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className={cn("inline-block will-change-transform", wordClassName)}
          variants={{
            hidden: { opacity: 0, y: 16, filter: "blur(8px)", scale: 0.97 },
            show: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              scale: 1,
              transition: { duration: 0.5, ease: exploreEase },
            },
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : null}
        </motion.span>
      ))}
    </motion.span>
  );
}

function LoginHeroCopy() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative z-2 w-full max-w-[600px] text-start">
      <div
        className="mb-6 h-1 w-[70px] rounded-full bg-[linear-gradient(90deg,#2da8ff,#7040ff)]"
        aria-hidden
      />
      <h1
        className={cn(
          isAr
            ? "font-['Alexandria','Cairo',sans-serif] font-bold tracking-normal"
            : "font-['Plus_Jakarta_Sans',Inter,system-ui,sans-serif] font-extrabold tracking-[-0.04em]",
          "text-[clamp(2rem,4.6vw,3.25rem)] leading-[1.09] text-white",
        )}
      >
        <span className="block text-white">
          <ExploreWords text={t("login.lead")} delay={0.1} />
        </span>
        <span className="mt-1 block bg-[linear-gradient(90deg,#28a4ff,#7651ff)] bg-clip-text text-transparent [-webkit-text-fill-color:transparent]">
          {t("login.rest")}
        </span>
        <span className="mt-1 block text-white">
          <ExploreWords text={t("login.accent")} delay={0.52} />
        </span>
      </h1>

      <motion.p
        className={cn(
          isAr
            ? "mt-7 max-w-[570px] font-['Cairo','Alexandria',sans-serif] tracking-normal"
            : "mt-7 max-w-[570px] font-['Plus_Jakarta_Sans',system-ui,sans-serif]",
          "text-[clamp(15px,1.5vw,18px)] font-medium leading-[1.75] text-[#b9c8e2]",
        )}
        initial={reduceMotion ? false : { opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.85, duration: 0.55, ease: exploreEase }}
      >
        {t("login.sub")}
      </motion.p>
    </div>
  );
}

const FEATURES = [
  {
    id: "cockpit",
    icon: "/Portfolio cockpit.png",
    titleKey: "login.featureCockpit",
    bodyKey: "login.featureCockpitBody",
  },
  {
    id: "builder",
    icon: "/Builder workflow.png",
    titleKey: "login.featureBuilder",
    bodyKey: "login.featureBuilderBody",
  },
  {
    id: "risk",
    icon: "/Risk & audit.png",
    titleKey: "login.featureRisk",
    bodyKey: "login.featureRiskBody",
  },
] as const;

const TRUST_LOGOS = [
  { src: "/company-1.png", altKey: "login.altQfma" },
  { src: "/company-2.png", altKey: "login.altIso" },
  { src: "/company-3.png", altKey: "login.altQse" },
] as const;

function HeroMarketArt() {
  return (
    <div className="relative hidden min-h-[220px] w-full lg:block" aria-hidden>
      <img
        src="/chart-login.png"
        alt=""
        className="h-full w-full object-contain object-center"
      />
    </div>
  );
}

function FieldShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-7 flex h-16 items-center gap-3 rounded-xl border border-[#d7dfec] bg-white px-[15px]",
        "shadow-[0_5px_14px_rgba(30,55,95,.04)]",
        "focus-within:border-[#8eb0f0] focus-within:shadow-[0_0_0_3px_rgba(22,118,238,.12)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default function Login() {
  const { t } = useTranslation();

  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setUsername(saved);
        setRemember(true);
      }
    } catch { /* ignore */ }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, username);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch { /* ignore */ }
      setLocation("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("login.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-[#f4f7fc] font-sans text-[#0b1c3d] lg:h-dvh lg:overflow-hidden">
      <div className="grid min-h-dvh w-full lg:h-dvh lg:grid-cols-[61%_39%]">
        <section
          className={cn(
            "relative flex min-h-0 flex-col overflow-hidden text-white",
            "bg-[radial-gradient(circle_at_80%_34%,rgba(25,91,210,.22),transparent_28%),radial-gradient(circle_at_45%_70%,rgba(27,93,255,.14),transparent_35%),linear-gradient(135deg,#020b20_0%,#041534_55%,#020b21_100%)]",
            "max-lg:px-5 max-lg:py-8",
            "lg:px-[clamp(1.5rem,4vw,2.6rem)] lg:pb-5 lg:pt-6",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(55,129,255,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(55,129,255,.07)_1px,transparent_1px)] [background-size:48px_48px]"
            aria-hidden
          />

          <div className="relative z-4 isolate h-[clamp(64px,9vh,96px)] w-[min(100%,360px)] shrink-0 self-start overflow-hidden">
            <BrandLogo
              variant="dark"
              className="h-full w-full origin-start object-contain object-left mix-blend-screen rtl:object-right"
            />
          </div>

          <div className="relative z-2 mt-8 grid min-h-0 flex-1 grid-cols-1 items-center gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <LoginHeroCopy />
            <HeroMarketArt />
          </div>

          <div className="relative z-5 mt-auto hidden shrink-0 grid-cols-3 gap-4 pt-6 lg:grid">
            {FEATURES.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "flex min-w-0 flex-col rounded-[17px]   px-6 py-5",
                  "bg-[linear-gradient(145deg,rgba(11,36,79,.72),rgba(2,17,42,.9))]",
                  "shadow-[inset_0_1px_rgba(255,255,255,.06),0_18px_50px_rgba(0,0,0,.2)]",
                )}
              >
                <div className="mb-4 grid h-full w-[150px] place-items-center overflow-hidden rounded-[15px]  bg-[rgba(20,69,151,.25)]">
                  <img
                    src={item.icon}
                    alt=""
                    className="w-full h-full object-contain mix-blend-screen"
                  />
                </div>
                <h3 className="text-[19px] font-semibold leading-tight">{t(item.titleKey)}</h3>
                <p className="mt-2 max-w-[245px] text-[15px] leading-[1.55] text-[#aebdd6]">
                  {t(item.bodyKey)}
                </p>
              </article>
            ))}
          </div>

          <div className="relative z-6 mt-4 hidden items-center justify-between gap-3 text-[13px] text-[#91a4c2] lg:flex">
            <span className="flex items-center gap-2">
              <span aria-hidden>♢</span>
              {t("login.regulated")}
              <span aria-hidden>•</span>
              {t("login.doha")}
            </span>
            <span>{t("login.copyright")}</span>
          </div>
        </section>

        <section
          className={cn(
            "relative flex min-h-0 flex-col items-center justify-center overflow-hidden",
            "bg-[radial-gradient(circle_at_88%_8%,rgba(55,120,255,.08),transparent_25%),linear-gradient(135deg,#f8faff,#eef3fb)]",
            "px-[clamp(1.25rem,5.7vw,2.5rem)] py-[clamp(4.5rem,8vh,5.5rem)]",
          )}
        >
          <div
            className="pointer-events-none absolute -end-[210px] -top-[285px] size-[530px] rounded-full border border-[rgba(75,124,240,.1)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -end-[280px] -top-[360px] size-[680px] rounded-full border border-[rgba(75,124,240,.1)]"
            aria-hidden
          />

          <div className={cn(AUTH_WIDTH, "relative z-2 flex flex-col")}>
            <form
              onSubmit={handleLogin}
              className={cn(
                "relative rounded-[24px] border border-[rgba(210,220,238,.8)] bg-white/92",
                "px-[clamp(1.35rem,4vw,2.375rem)] pb-9 pt-[4.4rem]",
                "shadow-[0_28px_70px_rgba(28,53,99,.13)]",
              )}
            >
              <div
                className="absolute start-1/2 top-0 grid size-[125px] -translate-x-1/2 -translate-y-[48%] place-items-center rounded-full border border-[#e5eaf4] bg-white shadow-[0_16px_35px_rgba(37,64,110,.16)]"
                aria-hidden
              >
                <BrandLogo
                  variant="mark"
                  decorative
                  className="size-[118px] object-contain"
                />
              </div>

              <p className="mb-2.5 text-[15px] text-[#1764ff]">{t("login.welcomeBack")}</p>
              <h2 className="mb-[30px] text-[clamp(1.7rem,3vw,2rem)] font-bold leading-none tracking-[-1px] text-[#0b1c3d]">
                {t("login.signIn")}
              </h2>

              {error ? (
                <div
                  className="mb-5 rounded-xl border border-rose-200/80 bg-[#fff5f6] px-3 py-2 text-xs text-rose-600"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}

              <label className="mb-2.5 block text-xs font-bold tracking-[0.04em] text-[#52637f]" htmlFor="username">
                {t("login.username")}
              </label>
              <FieldShell>
                <Mail className="size-[23px] shrink-0 text-[#657999]" aria-hidden />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder={t("login.usernamePlaceholder")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="login-plain-input h-auto min-h-0 min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-base text-[#63718b] shadow-none outline-none"
                />
              </FieldShell>

              <label className="mb-2.5 block text-xs font-bold tracking-[0.04em] text-[#52637f]" htmlFor="password">
                {t("login.password")}
              </label>
              <FieldShell>
                <Lock className="size-[23px] shrink-0 text-[#657999]" aria-hidden />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={cn(
                    "login-plain-input h-auto min-h-0 min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-[#63718b] shadow-none outline-none",
                    !showPassword && "text-base tracking-[3px]",
                    showPassword && "text-base",
                  )}
                />
                <button
                  type="button"
                  className="ms-auto grid size-8 place-items-center rounded-full text-[#657999] transition-colors hover:bg-[#eef3fb] hover:text-[#0b1c3d]"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                >
                  {showPassword ? <EyeOff className="size-[22px]" /> : <Eye className="size-[22px]" />}
                </button>
              </FieldShell>

              <div className="mb-[26px] flex items-center justify-between gap-3 text-sm text-[#63718b]">
                <label className="relative flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-[5px] border border-[#ccd7e8] bg-white transition-[background,border-color]",
                      remember && "border-[#075eff] bg-[#075eff] text-white",
                    )}
                  >
                    {remember ? <Check className="size-3" /> : null}
                  </span>
                  {t("login.rememberMe")}
                </label>
                <span className="text-[#075eff]" title={t("login.contactAdmin")}>
                  {t("login.forgotPassword")}
                </span>
              </div>

              <Button
                type="submit"
                loading={loading}
                size="block"
                className="h-[62px] gap-4 text-[17px]"
              >
                {t("login.enterWorkspace")}
                <ArrowRight className="size-6 rtl:rotate-180" />
              </Button>
            </form>

            <div
              className={cn(
                "mt-7 rounded-[22px] border border-[#e0e6f0] bg-white/86 px-5 pb-[18px] pt-6",
                "text-center shadow-[0_18px_45px_rgba(28,53,99,.08)]",
              )}
            >
              <div className="flex h-[86px] items-center justify-center gap-4">
                {TRUST_LOGOS.map((logo) => (
                  <img
                    key={logo.src}
                    src={logo.src}
                    alt={t(logo.altKey)}
                    className="h-full min-w-0 max-w-[32%] flex-1 object-contain mix-blend-multiply"
                  />
                ))}
              </div>
              <p className="mt-2 text-[15px] text-[#566782]">
                {t("login.trustLine")}
              </p>
            </div>

            <p className="mt-5 text-center text-[10px] text-[#53627e] lg:hidden">
              {t("login.copyrightShort")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
