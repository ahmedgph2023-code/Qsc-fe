import { useState } from "react";
import { ChevronRight, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useLocale } from "@/i18n/LocaleProvider";
import { getNavPageGuide } from "@/lib/navPageGuides";
import { cn } from "@/lib/utils";

export function NavItemHelp({
  href,
  title,
  className,
  iconOnly = false,
}: {
  href: string;
  title: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const { t } = useTranslation();
  const { locale, dir } = useLocale();
  const guide = getNavPageGuide(href, locale);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreTab, setMoreTab] = useState<"simple" | "technical">("simple");
  if (!guide) return null;

  const side = dir === "rtl" ? "left" : "right";

  return (
    <HoverCard
      openDelay={200}
      closeDelay={280}
      onOpenChange={(open) => {
        if (!open) {
          setMoreOpen(false);
          setMoreTab("simple");
        }
      }}
    >
      <HoverCardTrigger asChild>
        <button
          type="button"
          className={cn(
            "nav-help-btn grid shrink-0 place-items-center rounded-full",
            "focus-visible:outline-none",
            iconOnly ? "is-icon-only size-5" : "size-6",
            className,
          )}
          aria-label={t("nav.pageHelpAria", { page: title })}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Info className={iconOnly ? "size-3" : "size-3.5"} strokeWidth={2.25} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align="start"
        sideOffset={14}
        className={cn(
          "z-[100] w-[min(440px,calc(100vw-2rem))] border-(--shell-border) bg-(image:--shell-surface) p-0 text-(--shell-ink) shadow-(--shell-chrome-elev)",
          "rounded-2xl font-sans",
        )}
      >
        <div className="border-b border-(--shell-line) px-4 py-3.5">
          <p className="text-[11px] font-bold tracking-[0.04em] text-(--shell-muted)">
            {t("nav.pageGuide")}
          </p>
          <h3 className="mt-1 text-[16px] font-extrabold leading-snug tracking-tight text-(--shell-ink)">
            {title}
          </h3>
          <p className="mt-2 text-[13.5px] leading-7 text-(--shell-muted)">{guide.summary}</p>
        </div>

        <div className="max-h-[min(72vh,620px)] space-y-4 overflow-y-auto px-4 py-3.5 text-[13px] leading-7">
          <GuideBlock label={t("nav.guideForWho")} body={guide.forWho} />
          <GuideBlock label={t("nav.guideWhatItDoes")} body={guide.whatItDoes} />
          <GuideList label={t("nav.guideWhatYouGet")} items={guide.whatYouGet} />
          <GuideList label={t("nav.guideHowToUse")} items={guide.howToUse} />

          <div className="border-t border-(--shell-line) pt-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-(--shell-blue) transition-colors hover:text-(--shell-ink)"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMoreOpen((v) => !v);
              }}
            >
              <span>{moreOpen ? t("nav.readLess") : t("nav.readMore")}</span>
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 transition-transform duration-200",
                  moreOpen && "rotate-90",
                )}
                aria-hidden
              />
            </button>

            {moreOpen ? (
              <div className="mt-2.5 space-y-3">
                <div className="flex gap-1 rounded-lg bg-(--shell-mix-base,transparent) p-1">
                  <MoreTab
                    active={moreTab === "simple"}
                    label={t("nav.moreSimple")}
                    onClick={() => setMoreTab("simple")}
                  />
                  <MoreTab
                    active={moreTab === "technical"}
                    label={t("nav.moreTechnical")}
                    onClick={() => setMoreTab("technical")}
                  />
                </div>
                <GuideList
                  label={moreTab === "simple" ? t("nav.moreSimple") : t("nav.moreTechnical")}
                  items={moreTab === "simple" ? guide.moreSimple : guide.moreTechnical}
                  tone={moreTab === "technical" ? "muted" : "default"}
                />
              </div>
            ) : null}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function MoreTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex-1 rounded-md px-2 py-1.5 text-[12px] font-bold transition",
        active
          ? "bg-(image:--shell-surface) text-(--shell-blue) shadow-(--shell-soft)"
          : "text-(--shell-muted) hover:text-(--shell-ink)",
      )}
    >
      {label}
    </button>
  );
}

function GuideBlock({ label, body }: { label: string; body: string }) {
  return (
    <section>
      <h4 className="mb-1.5 text-[11px] font-extrabold tracking-[0.03em] text-(--shell-blue)">
        {label}
      </h4>
      <p className="text-(--shell-ink)/90">{body}</p>
    </section>
  );
}

function GuideList({
  label,
  items,
  tone = "default",
}: {
  label: string;
  items: string[];
  tone?: "default" | "muted";
}) {
  return (
    <section>
      <h4 className="mb-1.5 text-[11px] font-extrabold tracking-[0.03em] text-(--shell-blue)">
        {label}
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className={cn(
              "relative ps-3.5 before:absolute before:start-0 before:top-[0.7em] before:size-1.5 before:rounded-full before:bg-(--shell-blue)",
              tone === "muted" ? "text-(--shell-muted)" : "text-(--shell-ink)/90",
            )}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
