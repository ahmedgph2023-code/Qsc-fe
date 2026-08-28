import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { getCustomers, createCustomer, deleteCustomer, getPortfolioManager, type CustomerData, type PortfolioManagerRow } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpRight, ArrowDownRight, Loader2, AlertTriangle,
  Download, SlidersHorizontal, MoreVertical, CalendarDays, Phone, Trash2, ExternalLink,
  ArrowUpDown, Plus,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MandateBadge } from "@/components/phase1/MandateBadge";
import { PageHeader } from "@/components/phase1/PageHeader";
import { StatsSummaryBar } from "@/components/phase1/StatsSummaryBar";
import { AnimatedNumber } from "@/components/phase1/AnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";
import { SelectField } from "@/components/phase1/SelectField";
import { DatePicker } from "@/components/phase1/DatePicker";
import { DataTableCard, DataTableEmpty, DataTableHead, DataTableIconBtn } from "@/components/phase1/DataTableCard";
import { cn } from "@/lib/utils";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Dr", "Sheikh", "Sheikha", "Eng"];
const PAGE_SIZES = [10, 25, 50];

type SortKey = "nav" | "invested" | "return";
type ExtraCol = "cash" | "risk" | "controls";

function clientInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "—";
}

function avatarTone(name: string): "blue" | "purple" | "gold" {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i)) % 3;
  return (["blue", "purple", "gold"] as const)[hash];
}

const AVATAR_TONE = {
  blue: "bg-[var(--color-info-soft)] text-[var(--color-info)]",
  purple: "bg-[color-mix(in_srgb,#7956d8_16%,var(--color-surface-elevated))] text-[#6d4bd1]",
  gold: "bg-[var(--color-bronze-soft)] text-[var(--color-bronze)]",
} as const;

const cellPy = "!py-2 align-middle";

function CellLabel({ children }: { children: string }) {
  return (
    <span className="mb-1 hidden font-mono text-[11px] font-extrabold uppercase tracking-[0.06em] text-muted-foreground max-[900px]:block">
      {children}
    </span>
  );
}

function ClientsSkeletonRows({ extra }: { extra: Record<ExtraCol, boolean> }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i} className="clients-row pointer-events-none hover:bg-transparent">
          <TableCell className={cn(cellPy, "ps-5")}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" style={{ animationDelay: `${i * 40}ms` }} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40 rounded-full" />
                <Skeleton className="h-2.5 w-52 max-w-full rounded-full" />
                <Skeleton className="h-2 w-36 max-w-full rounded-full" />
              </div>
            </div>
          </TableCell>
          <TableCell className={cellPy}>
            <Skeleton className="h-3.5 w-28 rounded-full" />
            <Skeleton className="mt-2 h-6 w-full max-w-[168px] rounded-lg" />
          </TableCell>
          <TableCell className={cellPy}><Skeleton className="h-3.5 w-24 rounded-full" /></TableCell>
          {extra.cash && <TableCell className={cellPy}><Skeleton className="h-3.5 w-20 rounded-full" /></TableCell>}
          <TableCell className={cellPy}><Skeleton className="h-7 w-[4.5rem] rounded-md" /></TableCell>
          <TableCell className={cellPy}>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </TableCell>
          {extra.risk && <TableCell className={cellPy}><Skeleton className="h-3.5 w-16 rounded-full" /></TableCell>}
          {extra.controls && <TableCell className={cellPy}><Skeleton className="h-3.5 w-16 rounded-full" /></TableCell>}
          <TableCell className={cn(cellPy, "pe-5")}>
            <Skeleton className="size-8 rounded-[10px]" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

function labelClientType(t: TranslateFn, value?: string | null) {
  if (value === "company") return t("common.company");
  return t("common.individual");
}

function labelRisk(t: TranslateFn, value?: string | null) {
  if (value === "medium") return t("common.medium");
  if (value === "high") return t("common.high");
  return value || "";
}

function labelMandateStatus(t: TranslateFn, value?: string | null) {
  if (!value) return "";
  const map: Record<string, string> = {
    pending: "common.pending",
    approved: "common.approved",
    amended: "common.amended",
    rejected: "common.rejected",
    closed: "common.closed",
  };
  return map[value] ? t(map[value]) : value;
}

function labelShariah(t: TranslateFn, value?: string | null) {
  if (value === "fully_shariah") return t("common.fullyShariah");
  if (value === "unrestricted") return t("common.unrestricted");
  return value || "";
}

function exportClientsCsv(
  t: TranslateFn,
  rows: Array<{
    customer: CustomerData;
    manager?: PortfolioManagerRow;
    nav: number;
    invested: number;
    ret: number;
  }>,
) {
  const header = [
    t("common.name"),
    t("customers.email"),
    t("customers.csvAccount"),
    t("common.type"),
    t("customers.joinDate"),
    t("customers.mobile"),
    t("customers.currentValue"),
    t("customers.totalInvested"),
    t("customers.cash"),
    t("customers.returnPct"),
    t("customers.mandate"),
    t("common.shariah"),
    t("customers.risk"),
    t("customers.openAlerts"),
    t("customers.pendingRebalance"),
  ];
  const lines = [
    header.join(","),
    ...rows.map(({ customer, manager, nav, invested, ret }) =>
      [
        csvCell(customer.name),
        csvCell(customer.email),
        csvCell(manager?.accountNumber),
        csvCell(labelClientType(t, customer.clientType)),
        csvCell(customer.joinDate),
        csvCell(customer.mobileNumber),
        csvCell(nav.toFixed(2)),
        csvCell(invested.toFixed(2)),
        csvCell(manager ? manager.cash.toFixed(2) : ""),
        csvCell(ret.toFixed(2)),
        csvCell(labelMandateStatus(t, manager?.mandateStatus)),
        csvCell(labelShariah(t, manager?.shariahPreference)),
        csvCell(labelRisk(t, manager?.riskProfile)),
        csvCell(manager?.openRiskAlerts ?? 0),
        csvCell(manager?.pendingRebalance ? t("common.yes") : t("common.no")),
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "clients.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function NavSpark({ id, invested, nav, tone, className }: { id: string; invested: number; nav: number; tone: "blue" | "purple" | "gold"; className?: string }) {
  const stroke = tone === "purple" ? "#8763e8" : tone === "gold" ? "#f3a516" : "#1760f3";
  const gid = `clients-spark-${id}`;
  const width = 198;
  const height = 38;
  const flat = invested === 0 && nav === 0;
  const hi = Math.max(invested, nav, 1);
  const lo = Math.min(invested, nav, 0);
  const span = hi - lo || 1;
  const y = (value: number) => 6 + (1 - (value - lo) / span) * 24;
  const y0 = flat ? 20 : y(invested);
  const y1 = flat ? 20 : y(nav);
  const midY = Math.min(y0, y1) - 5;
  const line = `M0 ${y0} Q ${width / 2} ${midY} ${width} ${y1}`;
  return (
    <svg className={cn("block h-[38px] w-full max-w-[198px]", className)} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={stroke} stopOpacity="0.28" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.2" />
    </svg>
  );
}

function NewCustomerDialog({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split("T")[0]);
  const [clientType, setClientType] = useState<"individual" | "company">("individual");
  const [title, setTitle] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [birthdate, setBirthdate] = useState("");
  const [nationality, setNationality] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idValidity, setIdValidity] = useState("");

  const isCompany = clientType === "company";

  function reset() {
    setName(""); setEmail(""); setJoinDate(new Date().toISOString().split("T")[0]);
    setClientType("individual"); setTitle(""); setGender(""); setBirthdate("");
    setNationality(""); setMobileNumber(""); setCity(""); setCountry("");
    setIdNumber(""); setIdValidity("");
  }

  const createMut = useMutation({
    mutationFn: () =>
      createCustomer({
        name,
        email,
        joinDate,
        clientType,
        title: !isCompany && title ? title : undefined,
        gender: !isCompany && gender ? gender : undefined,
        birthdate: !isCompany && birthdate ? birthdate : undefined,
        nationality: !isCompany && nationality ? nationality : undefined,
        mobileNumber: mobileNumber || undefined,
        city: city || undefined,
        country: country || undefined,
        idNumber: idNumber || undefined,
        idValidity: idValidity || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-manager"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      reset();
      setOpen(false);
    },
  });

  if (!canPerformAction("customer.create", { role, username })) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="max-[900px]:w-full">
          <Plus className="size-4" />
          {t("customers.newCustomer")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("customers.newCustomer")}</DialogTitle>
          <DialogDescription>{t("customers.createHint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase font-mono">{t("customers.clientType")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={clientType === "individual" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setClientType("individual")}
              >
                {t("common.individual")}
              </Button>
              <Button
                type="button"
                variant={clientType === "company" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setClientType("company")}
              >
                {t("common.company")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {!isCompany && (
              <div className="space-y-2 col-span-1">
                <Label className="text-xs uppercase font-mono">{t("customers.titleField")}</Label>
                <SelectField
                  className="w-full"
                  value={title}
                  onValueChange={setTitle}
                  options={[{ value: "", label: t("common.na") }, ...TITLE_OPTIONS.map((opt) => ({ value: opt, label: opt }))]}
                />
              </div>
            )}
            <div className={`space-y-2 ${isCompany ? "col-span-3" : "col-span-2"}`}>
              <Label className="text-xs uppercase font-mono">{isCompany ? t("common.companyName") : t("customers.fullName")}</Label>
              <Input
                placeholder={isCompany ? t("customers.placeholderCompanyName") : t("customers.placeholderFullName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase font-mono">{t("customers.email")}</Label>
            <Input type="email" placeholder={t("customers.placeholderEmail")} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{t("customers.mobile")}</Label>
              <Input type="tel" placeholder={t("customers.placeholderMobile")} value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{t("customers.joinDate")}</Label>
              <DatePicker value={joinDate} onChange={setJoinDate} />
            </div>
          </div>

          {!isCompany && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("customers.gender")}</Label>
                <SelectField
                  className="w-full"
                  value={gender}
                  onValueChange={(v) => setGender(v as "male" | "female" | "")}
                  options={[
                    { value: "", label: t("common.na") },
                    { value: "male", label: t("common.male") },
                    { value: "female", label: t("common.female") },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("customers.birthdate")}</Label>
                <DatePicker value={birthdate} onChange={setBirthdate} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{t("customers.city")}</Label>
              <Input placeholder={t("customers.placeholderCity")} value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{t("customers.country")}</Label>
              <Input placeholder={t("customers.placeholderCountry")} value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          {!isCompany && (
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{t("customers.nationality")}</Label>
              <Input placeholder={t("customers.placeholderNationality")} value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{isCompany ? t("customers.registrationNumber") : t("customers.idPassportNumber")}</Label>
              <Input
                placeholder={isCompany ? t("customers.placeholderCrNumber") : t("customers.placeholderIdNumber")}
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{isCompany ? t("customers.registrationValidity") : t("customers.idValidity")}</Label>
              <DatePicker value={idValidity} onChange={setIdValidity} />
            </div>
          </div>

          <Button className="w-full" onClick={() => createMut.mutate()} disabled={!name || !email || createMut.isPending}>
            {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
            {t("customers.createCustomer")}
          </Button>
          {createMut.isError && <p className="text-sm text-rose-500 font-mono">{(createMut.error as Error).message}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Customers() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("");
  const [status, setStatus] = useState("");
  const [shariah, setShariah] = useState("");
  const [breaches, setBreaches] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [extraCols, setExtraCols] = useState<Record<ExtraCol, boolean>>({ cash: false, risk: false, controls: false });
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { role, username } = useAuth();
  const canDeleteCustomer = canPerformAction("customer.delete", { role, username });
  const { data: customers = [], isPending: customersPending } = useQuery({ queryKey: ["customers"], queryFn: getCustomers });
  const { data: managerRows = [], isPending: managerPending } = useQuery({
    queryKey: ["portfolio-manager", risk, status, breaches],
    queryFn: () => getPortfolioManager({ risk, mandateStatus: status, breaches }),
  });
  const isLoading = customersPending || managerPending;
  const managerByCustomer = useMemo(
    () => new Map(managerRows.map((row) => [row.customerId, row])),
    [managerRows],
  );
  const filtersActive = Boolean(risk || status || breaches);
  const filterCount = [risk, status, shariah, breaches].filter(Boolean).length;

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-manager"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteTarget(null);
    },
  });

  const filtered = useMemo(() => customers.filter((c) => {
    const row = managerByCustomer.get(c.id);
    const hay = `${c.name} ${c.id} ${c.email} ${row?.accountNumber || ""}`.toLowerCase();
    if (!hay.includes(search.toLowerCase())) return false;
    if (shariah && row?.shariahPreference !== shariah) return false;
    if (filtersActive && !row) return false;
    return true;
  }), [customers, managerByCustomer, search, shariah, filtersActive]);

  const decorated = useMemo(() => filtered.map((customer) => {
    const manager = managerByCustomer.get(customer.id);
    return {
      customer,
      manager,
      nav: manager?.nav ?? customer.currentValue,
      invested: manager?.invested ?? customer.totalInvested,
      ret: manager?.returnPct ?? customer.returnPct,
    };
  }), [filtered, managerByCustomer]);

  const sorted = useMemo(() => {
    if (!sortKey) return decorated;
    const copy = [...decorated];
    copy.sort((a, b) => {
      const left = sortKey === "nav" ? a.nav : sortKey === "invested" ? a.invested : a.ret;
      const right = sortKey === "nav" ? b.nav : sortKey === "invested" ? b.invested : b.ret;
      return sortDir === "asc" ? left - right : right - left;
    });
    return copy;
  }, [decorated, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = sorted.length === 0 ? 0 : (safePage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);
  const colCount = 6 + Number(extraCols.cash) + Number(extraCols.risk) + Number(extraCols.controls);

  useEffect(() => { setPage(1); }, [search, risk, status, shariah, breaches, pageSize]);
  useEffect(() => { if (page !== safePage) setPage(safePage); }, [page, safePage]);

  const aum = managerRows.reduce((sum, row) => sum + Number(row.nav), 0);
  const investedTotal = managerRows.reduce((sum, row) => sum + Number(row.invested), 0);
  const weightedReturn = aum > 0
    ? managerRows.reduce((sum, row) => sum + Number(row.nav) * Number(row.returnPct), 0) / aum
    : 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleCol(col: ExtraCol) {
    setExtraCols((current) => ({ ...current, [col]: !current[col] }));
  }

  return (
    <Shell>
      <div className="clients-page flex flex-col gap-[22px]">
        <PageHeader
          className="mb-0 items-start border-b-0 pb-0"
          titleClassName="text-[clamp(1.85rem,3.4vw,2.7rem)] font-extrabold leading-none tracking-[-0.04em] text-[var(--color-text-primary)]"
          eyebrowClassName="text-[13px] font-extrabold normal-case tracking-[0.04em] text-[var(--color-bronze)]"
          descriptionClassName="mt-3.5 max-w-xl text-base text-[var(--color-text-secondary)]"
          title={t("customers.title")}
          description={t("customers.description")}
          actions={<NewCustomerDialog queryClient={queryClient} />}
        />

        <StatsSummaryBar
          ariaLabel={t("customers.clientTotals")}
          loading={isLoading}
          items={[
            {
              id: "accounts",
              icon: "/user.png",
              label: t("customers.totalAccounts"),
              value: <AnimatedNumber value={customers.length} format="integer" />,
              hint: t("customers.activeAccounts"),
            },
            {
              id: "aum",
              icon: "/finance.png",
              label: t("customers.totalPortfolioValue"),
              value: <AnimatedNumber value={aum} format="compactCurrency" />,
              hint: t("customers.acrossAll"),
            },
            {
              id: "invested",
              icon: "/layers.png",
              label: t("customers.totalInvested"),
              value: <AnimatedNumber value={investedTotal} format="compactCurrency" />,
              hint: t("customers.deployedCapital"),
            },
            {
              id: "return",
              icon: "/growth.png",
              label: t("customers.averageReturn"),
              value: (
                <>
                  <span>{weightedReturn >= 0 ? "↗ " : "↘ "}</span>
                  <AnimatedNumber value={Math.abs(weightedReturn)} format="percent" />
                </>
              ),
              hint: t("customers.weightedAverage"),
              valueClassName: weightedReturn >= 0 ? "text-[var(--color-positive)]" : undefined,
            },
          ]}
        />

        <DataTableCard
          icon="/user.png"
          count={`${filtered.length} ${filtered.length === 1 ? t("customers.account") : t("customers.accounts")}`}
          countLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("customers.searchPlaceholder")}
          searchLabel={t("customers.searchClients")}
          hotkey
          filterLabel={t("customers.filters")}
          filterCount={filterCount}
          filterPanel={
            <>
              <SelectField
                className="w-full"
                contentClassName="clients-select-content"
                value={risk}
                onValueChange={setRisk}
                aria-label={t("customers.riskProfile")}
                options={[
                  { value: "", label: t("customers.allRisk") },
                  { value: "medium", label: t("common.medium") },
                  { value: "high", label: t("common.high") },
                ]}
              />
              <SelectField
                className="w-full"
                contentClassName="clients-select-content"
                value={shariah}
                onValueChange={setShariah}
                aria-label={t("common.shariah")}
                options={[
                  { value: "", label: t("customers.allShariah") },
                  { value: "fully_shariah", label: t("common.fullyShariah") },
                  { value: "unrestricted", label: t("common.unrestricted") },
                ]}
              />
              <SelectField
                className="w-full"
                contentClassName="clients-select-content"
                value={status}
                onValueChange={setStatus}
                aria-label={t("customers.mandateStatus")}
                options={[
                  { value: "", label: t("customers.allMandates") },
                  { value: "pending", label: t("common.pending") },
                  { value: "approved", label: t("common.approved") },
                  { value: "amended", label: t("common.amended") },
                  { value: "rejected", label: t("common.rejected") },
                  { value: "closed", label: t("common.closed") },
                ]}
              />
              <SelectField
                className="w-full"
                contentClassName="clients-select-content"
                value={breaches}
                onValueChange={setBreaches}
                aria-label={t("customers.controlState")}
                options={[
                  { value: "", label: t("customers.allControls") },
                  { value: "1", label: t("customers.openBreaches") },
                ]}
              />
            </>
          }
          actions={
            <>
              <DataTableIconBtn
                label={t("customers.export")}
                icon={<Download className="size-4" />}
                disabled={isLoading || sorted.length === 0}
                onClick={() => exportClientsCsv(t, sorted)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DataTableIconBtn
                    label={t("customers.toggleColumns")}
                    icon={<SlidersHorizontal className="size-4" />}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="clients-menu">
                  <DropdownMenuCheckboxItem checked={extraCols.cash} onCheckedChange={() => toggleCol("cash")}>{t("customers.cash")}</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={extraCols.risk} onCheckedChange={() => toggleCol("risk")}>{t("customers.risk")}</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={extraCols.controls} onCheckedChange={() => toggleCol("controls")}>{t("customers.controls")}</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
          total={sorted.length}
          page={safePage}
          pageSize={pageSize}
          pageSizes={PAGE_SIZES}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          loading={isLoading}
          summary={
            sorted.length === 0
              ? t("customers.showingZero")
              : t("customers.showingRange", {
                  from: start + 1,
                  to: Math.min(start + pageSize, sorted.length),
                  total: sorted.length,
                })
          }
        >
            <TableHeader>
              <TableRow className="clients-thead-row h-10">
                  <DataTableHead className="ps-5">{t("common.client")}</DataTableHead>
                  <DataTableHead>
                    <button type="button" className="inline-flex cursor-pointer items-center gap-1.5 bg-transparent p-0 font-inherit tracking-inherit uppercase" onClick={() => toggleSort("nav")}>
                      {t("customers.currentValue")} <ArrowUpDown className="size-3 text-muted-foreground" />
                    </button>
                  </DataTableHead>
                  <DataTableHead>
                    <button type="button" className="inline-flex cursor-pointer items-center gap-1.5 bg-transparent p-0 font-inherit tracking-inherit uppercase" onClick={() => toggleSort("invested")}>
                      {t("customers.totalInvested")} <ArrowUpDown className="size-3 text-muted-foreground" />
                    </button>
                  </DataTableHead>
                  {extraCols.cash && <DataTableHead>{t("customers.cash")}</DataTableHead>}
                  <DataTableHead>
                    <button type="button" className="inline-flex cursor-pointer items-center gap-1.5 bg-transparent p-0 font-inherit tracking-inherit uppercase" onClick={() => toggleSort("return")}>
                      {t("customers.return")} <ArrowUpDown className="size-3 text-muted-foreground" />
                    </button>
                  </DataTableHead>
                  <DataTableHead>{t("customers.mandate")}</DataTableHead>
                  {extraCols.risk && <DataTableHead>{t("customers.risk")}</DataTableHead>}
                  {extraCols.controls && <DataTableHead>{t("customers.controls")}</DataTableHead>}
                  <DataTableHead className="w-12 pe-5">{""}</DataTableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="max-[900px]:block max-[900px]:w-full">
                {isLoading ? (
                  <ClientsSkeletonRows extra={extraCols} />
                ) : paged.length === 0 ? (
                  <DataTableEmpty
                    colSpan={colCount}
                    title={search || filtersActive || shariah ? t("customers.emptyMatchTitle") : t("customers.emptyTitle")}
                    description={search || filtersActive || shariah ? t("customers.emptyMatchDesc") : t("customers.emptyDesc")}
                  />
                ) : (
                  paged.map(({ customer, manager, nav, invested, ret }) => {
                    const tone = avatarTone(customer.name);
                    return (
                      <TableRow key={customer.id} className="clients-row group max-[900px]:relative max-[900px]:grid max-[900px]:grid-cols-2 max-[900px]:items-start max-[900px]:gap-x-4 max-[900px]:gap-y-3 max-[900px]:px-4 max-[900px]:py-3 max-[900px]:pe-14 max-[520px]:grid-cols-1 max-[520px]:pe-4 max-[520px]:pt-12">
                        <TableCell className={cn(cellPy, "ps-5 max-[900px]:col-span-2 max-[900px]:!p-0")}>
                          <Link href={`/customers-old/${customer.id}`} className="flex min-w-0 items-center gap-3">
                            <div className={cn("grid size-10 shrink-0 place-items-center rounded-full text-[12px] font-extrabold", AVATAR_TONE[tone])}>{clientInitials(customer.name)}</div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-semibold leading-tight text-[var(--shell-ink)]">
                                {customer.name}
                                {customer.clientType === "company" && <span className="rounded-full border border-[var(--shell-line)] px-1.5 py-px text-[9px] font-extrabold uppercase tracking-[0.04em] text-[var(--shell-muted)]">{t("common.company")}</span>}
                              </div>
                              <div className="mt-0.5 text-[11px] text-[var(--shell-muted)]">{customer.email}</div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                <CalendarDays className="h-3 w-3" />
                                {t("customers.since", { date: customer.joinDate })}
                                {customer.mobileNumber ? (
                                  <>
                                    <span>•</span>
                                    <Phone className="h-3 w-3" />
                                    {customer.mobileNumber}
                                  </>
                                ) : null}
                                {manager?.accountNumber ? (
                                  <>
                                    <span>•</span>
                                    {manager.accountNumber}
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className={cn(cellPy, "max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")}>
                          <CellLabel>{t("customers.currentValue")}</CellLabel>
                          <div className="clients-nav-cell">
                            <NavSpark id={customer.id} invested={invested} nav={nav} tone={tone} className="clients-nav-spark" />
                            <div className="clients-nav-value tabular-nums">{formatCurrency(nav)}</div>
                            {!extraCols.cash && manager ? (
                              <div className="clients-nav-cash">{t("customers.cashAmount", { amount: formatCurrency(manager.cash) })}</div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className={cn(cellPy, "text-[12.5px] font-medium tabular-nums text-[var(--shell-muted)] max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")}>
                          <CellLabel>{t("customers.totalInvested")}</CellLabel>
                          {formatCurrency(invested)}
                        </TableCell>
                        {extraCols.cash && (
                          <TableCell className={cn(cellPy, "text-[12.5px] tabular-nums text-[var(--shell-muted)] max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")}>
                            <CellLabel>{t("customers.cash")}</CellLabel>
                            {manager ? formatCurrency(manager.cash) : t("common.na")}
                          </TableCell>
                        )}
                        <TableCell className={cn(cellPy, "max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")}>
                          <CellLabel>{t("customers.return")}</CellLabel>
                          <div className={cn("inline-flex w-max items-center gap-1 rounded-md px-2 py-1 text-[12px] font-bold tabular-nums", ret < 0 ? "bg-[var(--color-negative-soft)] text-[var(--color-negative)]" : "bg-[var(--color-positive-soft)] text-[var(--color-positive)]")}>
                            {ret >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                            {Math.abs(ret).toFixed(2)}%
                          </div>
                        </TableCell>
                        <TableCell className={cn(cellPy, "max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")}>
                          <CellLabel>{t("customers.mandate")}</CellLabel>
                          <div className="flex flex-col items-start gap-1 [&_.mandate-chip]:rounded-full [&_.mandate-chip]:px-2 [&_.mandate-chip]:py-0.5 [&_.mandate-chip]:text-[10px] [&_.mandate-chip]:font-bold [&_.mandate-chip]:tracking-[0.02em]">
                            <MandateBadge value={manager?.mandateStatus} />
                            <MandateBadge value={manager?.shariahPreference} />
                            {!extraCols.controls && (manager?.openRiskAlerts || manager?.pendingRebalance || (manager && manager.openComplianceExceptions > 0)) ? (
                              <div className="flex flex-wrap gap-1">
                                {manager?.openRiskAlerts ? (
                                  <span className="severity-warning inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px]">
                                    <AlertTriangle className="h-3 w-3" />{manager.openRiskAlerts}
                                  </span>
                                ) : null}
                                {manager && manager.openComplianceExceptions > 0 ? (
                                  <span className="text-[10px] text-amber-600">{t("customers.exceptionsCount", { count: manager.openComplianceExceptions })}</span>
                                ) : null}
                                {manager?.pendingRebalance ? <span className="text-[10px] font-bold text-(--color-bronze)">{t("customers.rbPending")}</span> : null}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        {extraCols.risk && (
                          <TableCell className={cn(cellPy, "text-[12px] text-[var(--shell-muted)] max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")}>
                            <CellLabel>{t("customers.risk")}</CellLabel>
                            {manager?.riskProfile ? labelRisk(t, manager.riskProfile) : t("common.na")}
                          </TableCell>
                        )}
                        {extraCols.controls && (
                          <TableCell className={cn(cellPy, "max-[900px]:flex max-[900px]:flex-col max-[900px]:gap-1 max-[900px]:!p-0")}>
                            <CellLabel>{t("customers.controls")}</CellLabel>
                            {manager?.openRiskAlerts ? (
                              <span className="severity-warning inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px]">
                                <AlertTriangle className="h-3 w-3" />{manager.openRiskAlerts}
                              </span>
                            ) : null}
                            {manager && manager.openComplianceExceptions > 0 ? (
                              <span className="ms-1 text-[10px] text-amber-600">{t("customers.exceptionsCount", { count: manager.openComplianceExceptions })}</span>
                            ) : null}
                            <div className="mt-0.5 font-mono text-[10px]">{manager?.pendingRebalance ? t("customers.rbPending") : t("common.na")}</div>
                          </TableCell>
                        )}
                        <TableCell className={cn(cellPy, "pe-5 max-[900px]:absolute max-[900px]:end-3 max-[900px]:top-3 max-[900px]:!p-0")}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="clients-row-more h-10 w-10 rounded-[12px] border-0 px-0 text-[var(--shell-muted)]" aria-label={t("customers.actionsFor", { name: customer.name })}>
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="clients-menu">
                              <DropdownMenuItem onClick={() => setLocation(`/customers-old/${customer.id}`)}>
                                <ExternalLink /> {t("customers.openAccount")}
                              </DropdownMenuItem>
                              {canDeleteCustomer ? (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-rose-600" onClick={() => setDeleteTarget({ id: customer.id, name: customer.name })}>
                                    <Trash2 /> {t("common.delete")}
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
        </DataTableCard>
      </div>
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        itemName={deleteTarget?.name || ""}
        onConfirm={() => { if (deleteTarget) deleteMut.mutate(deleteTarget.id); }}
        isPending={deleteMut.isPending}
      />
    </Shell>
  );
}
