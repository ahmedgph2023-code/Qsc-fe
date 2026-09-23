import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { PanelEmptyState } from "@/components/phase1/PageHeader";

const TONES = ["#1f58e9", "#8551d8", "#18a270", "#11a3b0", "#e98921", "#315bc6", "#e24b57", "#7a8aa5"];
const OTHER_TONE = "#c5cedf";

export type DistributionSlice = {
  /** Short label shown in the legend, e.g. a ticker, a sector or a client name. */
  name: string;
  /** Market value; slices are sized by share of the total. */
  value: number;
};

/**
 * Donut for "share of total market value" panels (stocks, sectors, holders).
 * Slices beyond `maxSlices` collapse into one "Other" slice so the legend stays
 * readable; percentages are derived from the values passed in.
 */
export function DistributionDonut({
  title,
  slices,
  maxSlices = 8,
  emptyTitle,
}: {
  title: string;
  slices: DistributionSlice[];
  maxSlices?: number;
  emptyTitle?: string;
}) {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const positive = slices.filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
    const total = positive.reduce((s, r) => s + r.value, 0);
    if (!(total > 0)) return [];
    const head = positive.slice(0, maxSlices);
    const tailValue = positive.slice(maxSlices).reduce((s, r) => s + r.value, 0);
    const shown = tailValue > 0 ? [...head, { name: t("charts.other"), value: tailValue }] : head;
    return shown.map((slice, i) => ({
      ...slice,
      pct: (slice.value / total) * 100,
      fill: slice.name === t("charts.other") ? OTHER_TONE : TONES[i % TONES.length]!,
    }));
  }, [slices, maxSlices, t]);

  return (
    <section className="clients-table-card flex min-h-[18rem] flex-col p-4">
      <h3 className="mb-2 text-sm font-semibold text-[#16305f]">{title}</h3>
      {data.length === 0 ? (
        <PanelEmptyState
          className="min-h-[14rem] flex-1"
          icon={<PieChartIcon className="size-8" strokeWidth={1.5} />}
          title={emptyTitle ?? t("charts.empty")}
        />
      ) : (
        <>
          <div className="h-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={44} outerRadius={70} paddingAngle={2}>
                  {data.map((slice) => (
                    <Cell key={slice.name} fill={slice.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const slice = data.find((d) => d.name === name);
                    return [`${slice ? slice.pct.toFixed(2) : "0.00"}%`, name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5 overflow-y-auto text-xs">
            {data.map((slice) => (
              <li key={slice.name} className="flex items-center gap-2">
                <i className="size-2.5 shrink-0 rounded-full" style={{ background: slice.fill }} />
                <span className="truncate text-[#42506b]" title={slice.name}>{slice.name}</span>
                <span className="ms-auto font-data text-[#16305f]">{slice.pct.toFixed(2)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
