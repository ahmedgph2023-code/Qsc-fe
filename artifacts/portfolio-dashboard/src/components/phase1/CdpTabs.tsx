import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { TabsList } from "@/components/ui/tabs";
import { useLocale } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export const CDP_TAB =
  "cdp-tab relative z-[1] h-[51px] min-w-[118px] rounded-none border-0 bg-transparent px-[19px] py-0 text-[13px] font-medium text-[#53658c] shadow-none transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-[#1a4cc4] data-[state=active]:shadow-none";

/**
 * Tab strip for Customer Detail.
 * Sliding pill tracks the active trigger (works LTR/RTL via offsetLeft).
 */
export function CdpTabsList({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { dir } = useLocale();
  const listRef = useRef<HTMLDivElement>(null);
  const [ink, setInk] = useState({ x: 0, y: 0, w: 0, h: 0, ready: false });

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const sync = () => {
      const active = list.querySelector<HTMLElement>('[data-state="active"]');
      if (!active) {
        setInk((prev) => ({ ...prev, ready: false }));
        return;
      }
      setInk({
        x: active.offsetLeft,
        y: active.offsetTop,
        w: active.offsetWidth,
        h: active.offsetHeight,
        ready: true,
      });
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(list);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [value, children, dir]);

  return (
    <TabsList
      ref={listRef}
      dir={dir}
      className={cn(
        "cdp-tabs relative flex h-auto min-h-[51px] w-full flex-row flex-wrap !justify-start overflow-x-visible rounded-none bg-transparent p-0",
        className,
      )}
      data-active={value}
    >
      <span
        aria-hidden
        className={cn("cdp-tab-ink", ink.ready && "is-ready")}
        style={{
          width: ink.w,
          height: ink.h,
          transform: `translate3d(${ink.x}px, ${ink.y}px, 0)`,
        }}
      />
      {children}
    </TabsList>
  );
}
