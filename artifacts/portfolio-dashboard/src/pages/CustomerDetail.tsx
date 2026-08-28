import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "wouter";
import { Shell } from "@/components/layout/Shell";
import { getCustomer, getPortfolio, getTransactions, getStocks, createTransaction, getClosingPrice, checkTradeEligibility, getPortfolioCash, getPortfolioHoldings, bulkUploadTransactions, downloadTransactionTemplate, getMandate, saveMandate, approveMandate, rejectMandate, closeMandate, addMandateRestriction, deleteMandateRestriction, addPortfolioCash, deletePortfolioCash, bulkDeletePortfolioCash, getPhase1Portfolio, getFiPortfolioLots, rebuildFiPortfolioDailyPnl, updateCustomer, deleteTransaction, bulkDeleteTransactions, type CustomerData, type ClientType, type Gender, type Holding, type TransactionData, type StockData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, AlertTriangle, Plus, Loader2, Upload, Download, Trash2, PenLine, IdCard, Bell, MoreHorizontal } from "lucide-react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MandateBadge } from "@/components/phase1/MandateBadge";
import { FeeBandsCard } from "@/components/phase1/FeeBandsCard";
import { FilterBar, EmptyState, TableSkeletonRows } from "@/components/phase1/PageHeader";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReasonDialog } from "@/components/phase1/ReasonDialog";
import { SelectField } from "@/components/phase1/SelectField";
import { DatePicker } from "@/components/phase1/DatePicker";
import { DateRangePicker } from "@/components/phase1/DateRangePicker";
import { PerformanceAnalytics } from "@/components/phase1/PerformanceAnalytics";
import { ClientHoldingsStation } from "@/components/phase1/ClientHoldingsStation";
import { WorkbookKpiBar } from "@/components/phase1/WorkbookKpiBar";
import { buildClientHoldingsViewModel, emptyClientHoldingsViewModel } from "@/lib/clientHoldingsModel";
import { CDP_TAB, CdpTabsList } from "@/components/phase1/CdpTabs";
import { useAuth } from "@/lib/AuthContext";
import { canPerformAction } from "@/lib/access";
import { cn } from "@/lib/utils";
import { allowedGroups, benchmarkNameFor, modelCodeFor, normalizeShariahGroup, normalizePreference, type RiskProfile, type ShariahPreference } from "@/lib/mandatePreview";

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-QA", { style: "currency", currency: "QAR" }).format(val);

function txNumClass(type: string) {
  if (type === "BUY") return "cdp-col-buy";
  if (type === "SELL") return "cdp-col-sell";
  return "cdp-col-xfer";
}

const todayQatarIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Qatar" });

const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Dr", "Sheikh", "Sheikha", "Eng"];

function asDateInput(value?: string | null) {
  return String(value || "").slice(0, 10);
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm font-medium leading-snug">{children}</div>
    </div>
  );
}

function ClientDetailsDialog({ customer, iconOnly = false }: { customer: CustomerData; iconOnly?: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [joinDate, setJoinDate] = useState(asDateInput(customer.joinDate));
  const [clientType, setClientType] = useState<ClientType>(customer.clientType === "company" ? "company" : "individual");
  const [title, setTitle] = useState(customer.title || "");
  const [gender, setGender] = useState<Gender | "">(customer.gender || "");
  const [birthdate, setBirthdate] = useState(asDateInput(customer.birthdate));
  const [nationality, setNationality] = useState(customer.nationality || "");
  const [mobileNumber, setMobileNumber] = useState(customer.mobileNumber || "");
  const [city, setCity] = useState(customer.city || "");
  const [country, setCountry] = useState(customer.country || "");
  const [idNumber, setIdNumber] = useState(customer.idNumber || "");
  const [idValidity, setIdValidity] = useState(asDateInput(customer.idValidity));

  const isCompany = clientType === "company";

  function hydrate(c: CustomerData) {
    setName(c.name);
    setEmail(c.email);
    setJoinDate(asDateInput(c.joinDate));
    setClientType(c.clientType === "company" ? "company" : "individual");
    setTitle(c.title || "");
    setGender(c.gender || "");
    setBirthdate(asDateInput(c.birthdate));
    setNationality(c.nationality || "");
    setMobileNumber(c.mobileNumber || "");
    setCity(c.city || "");
    setCountry(c.country || "");
    setIdNumber(c.idNumber || "");
    setIdValidity(asDateInput(c.idValidity));
  }

  const updateMut = useMutation({
    mutationFn: () =>
      updateCustomer(customer.id, {
        name,
        email,
        joinDate,
        clientType,
        title: isCompany ? null : title || null,
        gender: isCompany ? null : gender || null,
        birthdate: isCompany ? null : birthdate || null,
        nationality: isCompany ? null : nationality || null,
        mobileNumber: mobileNumber || null,
        city: city || null,
        country: country || null,
        idNumber: idNumber || null,
        idValidity: idValidity || null,
      }),
    onSuccess: (updated) => {
      hydrate(updated);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["customer", customer.id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const isCompanyView = customer.clientType === "company";
  const rows: { label: string; value: string }[] = [
    { label: t("customerDetail.labelType"), value: isCompanyView ? t("common.company") : t("common.individual") },
    ...(!isCompanyView && customer.title ? [{ label: t("customerDetail.labelTitle"), value: customer.title }] : []),
    { label: isCompanyView ? t("customerDetail.labelCompanyName") : t("customerDetail.labelFullName"), value: customer.name },
    { label: t("customerDetail.labelEmail"), value: customer.email },
    ...(!isCompanyView && customer.gender ? [{ label: t("customerDetail.labelGender"), value: customer.gender === "male" ? t("common.male") : t("common.female") }] : []),
    ...(!isCompanyView && customer.birthdate ? [{ label: t("customerDetail.labelBirthdate"), value: asDateInput(customer.birthdate) }] : []),
    ...(!isCompanyView && customer.nationality ? [{ label: t("customerDetail.labelNationality"), value: customer.nationality }] : []),
    { label: t("customerDetail.labelMobile"), value: customer.mobileNumber || t("common.na") },
    { label: t("customerDetail.labelLocation"), value: [customer.city, customer.country].filter(Boolean).join(", ") || t("common.na") },
    { label: isCompanyView ? t("customerDetail.labelCrNumber") : t("customerDetail.labelIdNumber"), value: customer.idNumber || t("common.na") },
    { label: isCompanyView ? t("customerDetail.labelCrValidity") : t("customerDetail.labelIdValidity"), value: asDateInput(customer.idValidity) || t("common.na") },
    { label: t("customerDetail.labelJoinDate"), value: asDateInput(customer.joinDate) || t("common.na") },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          hydrate(customer);
          setEditing(false);
        }
      }}
    >
      <DialogTrigger asChild className="flex-none">
        {iconOnly ? (
          <button type="button" className="cdp-round" aria-label={t("customerDetail.viewDetails")}>
            <Bell className="h-5 w-5" />
          </button>
        ) : (
          <Button size="sm" variant="outline">
            <IdCard className="me-1.5 h-3.5 w-3.5" /> {t("customerDetail.viewDetailsBtn")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="cdp-modal sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("customerDetail.clientDetails")}</DialogTitle>
          <DialogDescription>
            {editing ? t("customerDetail.clientDetailsEditDesc") : t("customerDetail.clientDetailsViewDesc")}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{t("customerDetail.clientType")}</Label>
              <div className="flex gap-2">
                <Button type="button" variant={clientType === "individual" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setClientType("individual")}>{t("common.individual")}</Button>
                <Button type="button" variant={clientType === "company" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setClientType("company")}>{t("common.company")}</Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {!isCompany && (
                <div className="space-y-2 col-span-1">
                  <Label className="text-xs uppercase font-mono">{t("customerDetail.titleField")}</Label>
                  <SelectField
                    className="w-full"
                    value={title}
                    onValueChange={setTitle}
                    options={[{ value: "", label: t("common.na") }, ...TITLE_OPTIONS.map((opt) => ({ value: opt, label: opt }))]}
                  />
                </div>
              )}
              <div className={`space-y-2 ${isCompany ? "col-span-3" : "col-span-2"}`}>
                <Label className="text-xs uppercase font-mono">{isCompany ? t("customerDetail.companyName") : t("customerDetail.fullName")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{t("customerDetail.email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("customerDetail.mobileNumber")}</Label>
                <Input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("customerDetail.joinDate")}</Label>
                <DatePicker value={joinDate} onChange={setJoinDate} />
              </div>
            </div>

            {!isCompany && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-mono">{t("customerDetail.gender")}</Label>
                  <SelectField
                    className="w-full"
                    value={gender}
                    onValueChange={(v) => setGender(v as Gender | "")}
                    options={[
                      { value: "", label: t("common.na") },
                      { value: "male", label: t("common.male") },
                      { value: "female", label: t("common.female") },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-mono">{t("customerDetail.birthdate")}</Label>
                  <DatePicker value={birthdate} onChange={setBirthdate} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("customerDetail.city")}</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("customerDetail.country")}</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>

            {!isCompany && (
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("customerDetail.nationality")}</Label>
                <Input value={nationality} onChange={(e) => setNationality(e.target.value)} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{isCompany ? t("customerDetail.registrationCrNumber") : t("customerDetail.idPassportNumber")}</Label>
                <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{isCompany ? t("customerDetail.registrationValidity") : t("customerDetail.idValidity")}</Label>
                <DatePicker value={idValidity} onChange={setIdValidity} />
              </div>
            </div>

            {updateMut.isError && <p className="text-sm text-rose-500 font-mono">{(updateMut.error as Error).message}</p>}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => { hydrate(customer); setEditing(false); }} disabled={updateMut.isPending}>{t("common.cancel")}</Button>
              <Button onClick={() => updateMut.mutate()} disabled={!name || !email || updateMut.isPending}>
                {updateMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {t("customerDetail.saveChanges")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rows.map((row) => (
                <div key={row.label} className="rounded-md border border-border/70 bg-muted/10 px-3 py-2">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{row.label}</dt>
                  <dd className="mt-1 text-sm font-semibold break-all">{row.value}</dd>
                </div>
              ))}
            </dl>
            <DialogFooter>
              <Button onClick={() => { hydrate(customer); setEditing(true); }}>
                <PenLine className="me-1.5 h-3.5 w-3.5" /> {t("common.edit")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MandateControl({ customerId, portfolioId, asOf, onViewCash, onViewHoldings }: { customerId: string; portfolioId: string; asOf?: string; onViewCash?: () => void; onViewHoldings?: () => void }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const { role, username } = useAuth();
  const [shariahPreference, setShariahPreference] = useState<ShariahPreference>("fully_shariah");
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("medium");
  const [notes, setNotes] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [initialValue, setInitialValue] = useState("");
  const [restrictionType, setRestrictionType] = useState("stock");
  const [restrictionStockId, setRestrictionStockId] = useState("");
  const [restrictionSector, setRestrictionSector] = useState("");
  const [restrictionDesc, setRestrictionDesc] = useState("");
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [mandateEditOpen, setMandateEditOpen] = useState(false);
  const [mandateTab, setMandateTab] = useState("restrictions");
  const [error, setError] = useState("");

  const { data: mandate } = useQuery({ queryKey: ["mandate", customerId], queryFn: () => getMandate(customerId), retry: false });
  const { data: cash } = useQuery({ queryKey: ["portfolio-cash", portfolioId, asOf], queryFn: () => getPortfolioCash(portfolioId, asOf) });
  const { data: pack } = useQuery({ queryKey: ["phase1-portfolio", portfolioId, asOf], queryFn: () => getPhase1Portfolio(portfolioId, asOf) });
  const { data: stocks = [] } = useQuery({ queryKey: ["stocks"], queryFn: getStocks });

  useEffect(() => {
    if (mandate) {
      setShariahPreference(normalizePreference(mandate.shariahPreference));
      setRiskProfile(mandate.riskProfile);
      setNotes(mandate.notes || "");
      setContractStart(mandate.contractStart || "");
      setContractEnd(mandate.contractEnd || "");
      setInitialValue(mandate.initialValue != null ? String(mandate.initialValue) : "");
    }
  }, [mandate]);

  const refresh = () => {
    client.invalidateQueries({ queryKey: ["mandate", customerId] });
    client.invalidateQueries({ queryKey: ["portfolio-manager"] });
    client.invalidateQueries({ queryKey: ["phase1-portfolio", portfolioId] });
    client.invalidateQueries({ queryKey: ["portfolio-cash", portfolioId] });
  };

  const saveMut = useMutation({
    mutationFn: () => saveMandate(customerId, {
      shariahPreference,
      riskProfile,
      notes,
      contractStart: contractStart || null,
      contractEnd: contractEnd || null,
      initialValue: initialValue ? Number(initialValue) : null,
    }),
    onSuccess: () => { setError(""); setMandateEditOpen(false); refresh(); },
    onError: (e: Error) => setError(e.message),
  });
  const approveMut = useMutation({
    mutationFn: () => approveMandate(customerId),
    onSuccess: () => { setApproveOpen(false); refresh(); },
    onError: (e: Error) => setError(e.message),
  });
  const rejectMut = useMutation({
    mutationFn: (reason: string) => rejectMandate(customerId, reason),
    onSuccess: () => { setRejectOpen(false); refresh(); },
    onError: (e: Error) => setError(e.message),
  });
  const closeMut = useMutation({
    mutationFn: (reason: string) => closeMandate(customerId, reason),
    onSuccess: () => { setCloseOpen(false); refresh(); },
    onError: (e: Error) => setError(e.message),
  });
  const addRestrictionMut = useMutation({
    mutationFn: () => addMandateRestriction(customerId, {
      restrictionType,
      stockId: restrictionType === "stock" ? restrictionStockId || null : null,
      sector: restrictionType === "sector" ? restrictionSector || null : null,
      description: restrictionDesc || null,
    }),
    onSuccess: () => {
      setRestrictionStockId("");
      setRestrictionSector("");
      setRestrictionDesc("");
      refresh();
    },
    onError: (e: Error) => setError(e.message),
  });
  const deleteRestrictionMut = useMutation({
    mutationFn: (id: string) => deleteMandateRestriction(id),
    onSuccess: refresh,
  });

  const canMandateDraft = canPerformAction("mandate.draft", { role, username });
  const canApprove = canPerformAction("mandate.approve", { role, username });
  const derivedBenchmark = benchmarkNameFor(shariahPreference);
  const derivedModel = modelCodeFor(shariahPreference, riskProfile);
  const eligibleUniverse = normalizePreference(shariahPreference) === "fully_shariah"
    ? t("customerDetail.universeShariahOnly")
    : t("customerDetail.universeBoth");
  const sectors = Array.from(new Set(stocks.map((s) => s.sector))).sort();
  const status = mandate?.approvalStatus || "missing";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t("customerDetail.mandateControlTitle")}</CardTitle>
            <CardDescription>{t("customerDetail.mandateControlDesc")}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <MandateBadge value={status} />
            <MandateBadge value={shariahPreference} />
            <Badge variant="outline" className="font-mono text-xs">{derivedBenchmark} · {derivedModel}</Badge>
            {canMandateDraft && (
              <Button size="sm" variant="outline" onClick={() => setMandateEditOpen(true)}>
                <PenLine className="me-1.5 h-3.5 w-3.5" /> {t("common.edit")}
              </Button>
            )}
            {canApprove && mandate && !["approved", "closed"].includes(status) && (
              <Button size="sm" variant="outline" onClick={() => setApproveOpen(true)}>{t("common.approve")}</Button>
            )}
            {canApprove && mandate && ["pending", "amended"].includes(status) && (
              <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>{t("common.reject")}</Button>
            )}
            {canApprove && mandate && status === "approved" && (
              <Button size="sm" variant="destructive" onClick={() => setCloseOpen(true)}>{t("customerDetail.closeMandate")}</Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm font-mono text-[var(--color-negative)]">{error}</p>}
        <div className="grid gap-3 rounded-md border border-border/70 bg-muted/10 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label={t("customerDetail.mandateType")}>{t("customerDetail.discretionary")}</Fact>
          <Fact label={t("customerDetail.riskProfile")}><span className="capitalize">{riskProfile === "medium" ? t("customerDetail.riskMediumCore") : t("customerDetail.riskHighActive")}</span></Fact>
          <Fact label={t("customerDetail.benchmark")}><span className="font-mono">{derivedBenchmark}</span></Fact>
          <Fact label={t("customerDetail.modelCode")}><span className="font-mono">{derivedModel}</span></Fact>
          <Fact label={t("customerDetail.eligibleStocks")}><span className="font-mono">{eligibleUniverse}</span></Fact>
          <Fact label={t("customerDetail.contract")}>{contractStart || t("common.na")} → {contractEnd || t("common.na")}</Fact>
          <Fact label={t("customerDetail.initialValue")}><span className="font-data">{initialValue ? formatCurrency(Number(initialValue)) : t("common.na")}</span></Fact>
          <Fact label={t("customerDetail.notes")}>{notes?.trim() || t("common.na")}</Fact>
        </div>

            <Dialog open={mandateEditOpen} onOpenChange={setMandateEditOpen}>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>{t("customerDetail.editMandate")}</DialogTitle>
                  <DialogDescription>{t("customerDetail.editMandateDesc")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("customerDetail.shariahPreference")}</Label>
                    <SelectField
                      className="w-full"
                      value={shariahPreference}
                      onValueChange={(v) => setShariahPreference(v as ShariahPreference)}
                      options={[
                        { value: "fully_shariah", label: t("common.fullyShariah") },
                        { value: "unrestricted", label: t("common.unrestricted") },
                      ]}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("customerDetail.riskProfile")}</Label>
                    <SelectField
                      className="w-full"
                      value={riskProfile}
                      onValueChange={(v) => setRiskProfile(v as RiskProfile)}
                      options={[
                        { value: "medium", label: t("customerDetail.riskMediumOption") },
                        { value: "high", label: t("customerDetail.riskHighOption") },
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 rounded-md border border-border/70 bg-muted/20 p-3 text-sm">
                    <div><p className="text-muted-foreground text-xs">{t("customerDetail.benchmark")}</p><p className="font-mono font-semibold">{derivedBenchmark}</p></div>
                    <div><p className="text-muted-foreground text-xs">{t("customerDetail.modelCode")}</p><p className="font-mono font-semibold">{derivedModel}</p></div>
                    <div className="col-span-2"><p className="text-muted-foreground text-xs">{t("customerDetail.eligibleStocks")}</p><p className="font-mono">{eligibleUniverse}</p></div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t("customerDetail.contractStartEnd")}</Label>
                    <DateRangePicker
                      from={contractStart}
                      to={contractEnd}
                      onChange={({ from, to }) => {
                        setContractStart(from);
                        setContractEnd(to);
                      }}
                    />
                  </div>
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">{t("customerDetail.initialValueQar")}</Label><Input type="number" placeholder={t("common.optional")} value={initialValue} onChange={(e) => setInitialValue(e.target.value)} /></div>
                  <Input placeholder={t("customerDetail.mandateNotesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMandateEditOpen(false)} disabled={saveMut.isPending}>{t("common.cancel")}</Button>
                  <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
                    {saveMut.isPending ? <Loader2 className="me-2 h-3 w-3 animate-spin" /> : null}
                    {t("customerDetail.saveMandate")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

        <Tabs value={mandateTab} onValueChange={setMandateTab}>
          <CdpTabsList value={mandateTab}>
            <TabsTrigger value="restrictions" className={CDP_TAB}>{t("customerDetail.restrictionsTab", { count: (mandate?.restrictions || []).length })}</TabsTrigger>
            <TabsTrigger value="history" className={CDP_TAB}>{t("customerDetail.statusHistoryTab")}</TabsTrigger>
            <TabsTrigger value="control" className={CDP_TAB}>{t("customerDetail.controlPackTab")}</TabsTrigger>
          </CdpTabsList>
          <TabsContent value="restrictions" className="mt-3 space-y-3">
            {canMandateDraft && (
              <div className="cdp-filter-row">
                <SelectField
                  className="w-full min-w-0"
                  value={restrictionType}
                  onValueChange={setRestrictionType}
                  options={[
                    { value: "stock", label: t("common.stock") },
                    { value: "sector", label: t("common.sector") },
                    { value: "other", label: t("customerDetail.restrictionOther") },
                  ]}
                />
                {restrictionType === "stock" ? (
                  <SelectField
                    className="w-full min-w-0"
                    value={restrictionStockId}
                    onValueChange={setRestrictionStockId}
                    placeholder={t("customerDetail.selectStock")}
                    options={[{ value: "", label: t("customerDetail.selectStock") }, ...stocks.map((s) => ({ value: s.id, label: `${s.ticker} — ${s.companyName}` }))]}
                  />
                ) : restrictionType === "sector" ? (
                  <SelectField
                    className="w-full min-w-0"
                    value={restrictionSector}
                    onValueChange={setRestrictionSector}
                    placeholder={t("customerDetail.selectSector")}
                    options={[{ value: "", label: t("customerDetail.selectSector") }, ...sectors.map((s) => ({ value: s, label: s }))]}
                  />
                ) : (
                  <div className="hidden min-h-10 xl:block" aria-hidden />
                )}
                <Input className="min-w-0" placeholder={t("customerDetail.descriptionPlaceholder")} value={restrictionDesc} onChange={(e) => setRestrictionDesc(e.target.value)} />
                <Button disabled={addRestrictionMut.isPending || !mandate || (restrictionType === "stock" && !restrictionStockId) || (restrictionType === "sector" && !restrictionSector)} onClick={() => addRestrictionMut.mutate()}>
                  <Plus className="me-1 h-4 w-4" /> {t("customerDetail.addRestriction")}
                </Button>
              </div>
            )}
            {(mandate?.restrictions || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("customerDetail.noRestrictions")}</p>
            ) : (mandate?.restrictions || []).map((r: any) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{r.restrictionType}</p>
                  <p>{r.description || r.sector || stocks.find((s) => s.id === r.stockId)?.ticker || r.stockId || t("common.na")}</p>
                </div>
                {canMandateDraft && (
                  <Button size="icon" variant="ghost" className="cdp-delete" onClick={() => deleteRestrictionMut.mutate(r.id)} aria-label={t("customerDetail.deleteRestrictionAria")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>
          <TabsContent value="history" className="mt-3">
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {(mandate?.history || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("customerDetail.noStatusEvents")}</p>
              ) : (mandate?.history || []).map((h: any) => (
                <div key={h.id} className="border-b border-border/40 pb-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs uppercase">
                      {h.fromStatus || t("common.na")} → <span className="text-[var(--color-primary-ink)]">{h.toStatus}</span>
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">{h.changedAt ? new Date(h.changedAt).toLocaleString() : ""}</p>
                  </div>
                  <p className="text-muted-foreground">{h.reason || t("common.na")}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="control" className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="stat-tile p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">{t("customerDetail.cash")}</p>
                <p className="font-data text-lg font-semibold">{formatCurrency(Number(cash?.balance || 0))}</p>
              </div>
              <div className="stat-tile p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">{t("customerDetail.nav")}</p>
                <p className="font-data text-lg font-semibold">{formatCurrency(Number(pack?.valuation?.nav || 0))}</p>
              </div>
              <div className="stat-tile p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">{t("customerDetail.ytd")}</p>
                <p className="font-data text-lg font-semibold">{pack?.performance?.ytd == null ? t("common.na") : `${Number(pack.performance.ytd).toFixed(2)}%`}</p>
              </div>
              <div className="stat-tile p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">{t("customerDetail.riskAlerts")}</p>
                <p className="font-data text-lg font-semibold">{pack?.actions?.riskAlerts?.length || 0}</p>
              </div>
              <div className="stat-tile p-3">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">{t("customerDetail.exceptions")}</p>
                <p className="font-data text-lg font-semibold">{pack?.actions?.exceptions?.length || 0}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {onViewHoldings && (
                <Button type="button" variant="link" onClick={onViewHoldings} className="h-auto p-0">{t("customerDetail.holdings")}</Button>
              )}
              {onViewCash && (
                <Button type="button" variant="link" onClick={onViewCash} className="h-auto p-0">{t("customerDetail.cashLedgerLink")}</Button>
              )}
              <Link href="/risk" className="soft-link">{t("customerDetail.riskLink")}</Link>
              <Link href="/compliance" className="soft-link">{t("customerDetail.complianceLink")}</Link>
              <Link href="/rebalances" className="soft-link">{t("customerDetail.rebalancesLink")}</Link>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{t("customerDetail.approveMandateTitle")}</DialogTitle>
            <DialogDescription>
              {t("customerDetail.approveMandateDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={approveMut.isPending} onClick={() => setApproveOpen(false)}>{t("common.cancel")}</Button>
            <Button disabled={approveMut.isPending} onClick={() => approveMut.mutate()}>
              {approveMut.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("common.approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t("customerDetail.rejectMandateTitle")}
        description={t("customerDetail.rejectMandateDesc")}
        confirmLabel={t("common.reject")}
        destructive
        pending={rejectMut.isPending}
        onConfirm={(reason) => rejectMut.mutate(reason)}
      />
      <ReasonDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={t("customerDetail.closeMandateTitle")}
        description={t("customerDetail.closeMandateDesc")}
        confirmLabel={t("customerDetail.closeMandate")}
        destructive
        pending={closeMut.isPending}
        onConfirm={(reason) => closeMut.mutate(reason)}
      />
    </Card>
  );
}

function translatedShariahGroup(raw: string | null | undefined, t: (key: string) => string) {
  const n = normalizeShariahGroup(raw);
  if (n === "shariah") return t("common.shariah");
  if (n === "not_shariah") return t("common.notShariah");
  return t("customerDetail.unclassified");
}

function AddTransactionDialog({
  portfolioId,
  customerId,
  stocks,
  queryClient,
}: {
  portfolioId: string;
  customerId: string;
  stocks: StockData[];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const canTrade = canPerformAction("trade.mutate", { role, username });
  const [open, setOpen] = useState(false);
  const [stockId, setStockId] = useState("");
  const [txType, setTxType] = useState<"BUY" | "SELL" | "CLIENT_TRANSFER">("BUY");
  const [quantity, setQuantity] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [priceInput, setPriceInput] = useState("");
  const [dayLow, setDayLow] = useState<number | null>(null);
  const [dayHigh, setDayHigh] = useState<number | null>(null);
  const [closePrice, setClosePrice] = useState<number | null>(null);
  const [priceSourceDate, setPriceSourceDate] = useState<string | null>(null);
  const [priceError, setPriceError] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);

  const { data: cash } = useQuery({
    queryKey: ["portfolio-cash", portfolioId],
    queryFn: () => getPortfolioCash(portfolioId),
    enabled: open,
  });
  const { data: holdings = [] } = useQuery({
    queryKey: ["portfolio-holdings", portfolioId],
    queryFn: () => getPortfolioHoldings(portfolioId),
    enabled: open,
  });
  const { data: mandate } = useQuery({
    queryKey: ["mandate", customerId],
    queryFn: () => getMandate(customerId),
    enabled: open && !!customerId,
    retry: false,
  });
  const { data: eligibility, isFetching: eligibilityLoading } = useQuery({
    queryKey: ["trade-eligibility", portfolioId, stockId, txType],
    queryFn: () => checkTradeEligibility(portfolioId, stockId, txType === "SELL" ? "SELL" : "BUY"),
    enabled: open && !!stockId && txType !== "CLIENT_TRANSFER",
  });

  useEffect(() => {
    if (!open || !stockId || !txDate) {
      setPriceInput("");
      setDayLow(null);
      setDayHigh(null);
      setClosePrice(null);
      setPriceSourceDate(null);
      setPriceError("");
      return;
    }
    let cancelled = false;
    setPriceLoading(true);
    setPriceError("");
    getClosingPrice(stockId, txDate)
      .then((r) => {
        if (cancelled) return;
        setClosePrice(r.close ?? r.price);
        setDayLow(r.dayLow);
        setDayHigh(r.dayHigh);
        setPriceSourceDate(r.sourceDate);
        setPriceInput(String(r.close ?? r.price));
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setClosePrice(null);
        setDayLow(null);
        setDayHigh(null);
        setPriceSourceDate(null);
        setPriceInput("");
        setPriceError(e.message || t("customerDetail.noMarketPrice"));
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, stockId, txDate, t]);

  const pref = normalizePreference(mandate?.shariahPreference || "fully_shariah");
  const groups = allowedGroups(pref);
  const restrictedStockIds = new Set(
    (mandate?.restrictions || [])
      .filter((r: any) => r.isActive !== false && r.restrictionType === "stock" && r.stockId)
      .map((r: any) => r.stockId as string),
  );
  const restrictedSectors = new Set(
    (mandate?.restrictions || [])
      .filter((r: any) => r.isActive !== false && r.restrictionType === "sector" && r.sector)
      .map((r: any) => String(r.sector).toLowerCase()),
  );

  const cashBalance = Number(cash?.balance || 0);
  const qty = Number(quantity) || 0;
  const price = Number(priceInput);
  const priceValidNumber = Number.isFinite(price) && price > 0;
  const isClientTransfer = txType === "CLIENT_TRANSFER";
  const outOfRange =
    !isClientTransfer &&
    priceValidNumber &&
    dayLow != null &&
    dayHigh != null &&
    (price + 0.0001 < dayLow || price - 0.0001 > dayHigh);
  const tradeAmount = priceValidNumber && qty > 0 ? qty * price : 0;
  const held = (holdings as Holding[]).find((h) => h.stockId === stockId);
  const heldQty = held ? Number(held.quantity) : 0;
  const projectedCash = isClientTransfer ? cashBalance : txType === "BUY" ? cashBalance - tradeAmount : cashBalance + tradeAmount;
  const insufficientCash = txType === "BUY" && tradeAmount > 0 && tradeAmount > cashBalance + 0.0001;
  const insufficientShares = txType === "SELL" && qty > 0 && qty > heldQty + 0.0001;
  const notEligible = txType === "BUY" && !!stockId && eligibility && !eligibility.allowed;
  const mandateBlocked = !isClientTransfer && !!mandate && mandate.approvalStatus !== "approved";
  const canSubmit =
    !!stockId &&
    qty > 0 &&
    priceValidNumber &&
    !outOfRange &&
    !insufficientCash &&
    !insufficientShares &&
    !priceLoading &&
    (!priceError || (isClientTransfer && priceValidNumber)) &&
    !notEligible &&
    !mandateBlocked &&
    (isClientTransfer || !eligibilityLoading);

  const selected = stocks.find((s) => s.id === stockId);

  const createMut = useMutation({
    mutationFn: () => createTransaction(portfolioId, {
      stockId,
      type: txType,
      quantity: qty,
      price,
      useClosingPrice: false,
      timestamp: txDate ? new Date(txDate + "T00:00:00Z").toISOString() : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-cash", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-holdings", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["phase1-portfolio", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setStockId(""); setQuantity(""); setTxDate(new Date().toISOString().split("T")[0]);
      setPriceInput(""); setDayLow(null); setDayHigh(null); setClosePrice(null);
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {canTrade ? (
      <DialogTrigger asChild>
        <Button size="sm" className="cdp-add"><Plus className="w-4 h-4 me-1" /> {t("customerDetail.addTransaction")}</Button>
      </DialogTrigger>
      ) : null}
      <DialogContent className="cdp-modal sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("customerDetail.addTxTitle")}</DialogTitle>
          <DialogDescription>
            {isClientTransfer
              ? t("customerDetail.addTxDescTransfer")
              : t("customerDetail.addTxDescBuySell")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-xs font-mono space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">{t("customerDetail.mandate")}</span>
              <span>{mandate ? mandate.approvalStatus : t("customerDetail.missing")}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">{t("customerDetail.shariahPreference")}</span>
              <span>{pref === "fully_shariah" ? t("common.fullyShariah") : t("common.unrestricted")} · {normalizePreference(pref) === "fully_shariah" ? t("customerDetail.universeShariahOnly") : t("customerDetail.universeBoth")}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">{t("customerDetail.availableCash")}</span>
              <span className="font-semibold">{formatCurrency(cashBalance)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={txType === "BUY" ? "buy" : "outline"} size="sm" className="flex-1" onClick={() => setTxType("BUY")}>{t("common.buy")}</Button>
            <Button variant={txType === "SELL" ? "sell" : "outline"} size="sm" className="flex-1" onClick={() => setTxType("SELL")}>{t("common.sell")}</Button>
            <Button variant={txType === "CLIENT_TRANSFER" ? "secondary" : "outline"} size="sm" className="flex-1" onClick={() => setTxType("CLIENT_TRANSFER")}>{t("common.clientTransfer")}</Button>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-mono">{t("common.stock")}</Label>
            <SelectField
              className="w-full font-mono"
              value={stockId}
              onValueChange={setStockId}
              placeholder={t("customerDetail.selectStock")}
              options={[
                { value: "", label: t("customerDetail.selectStock") },
                ...stocks.map((s) => {
                  const blockedStock = restrictedStockIds.has(s.id);
                  const blockedSector = restrictedSectors.has((s.sector || "").toLowerCase());
                  const status = normalizeShariahGroup(s.shariahGroup);
                  const groupOk = !!status && groups.includes(status);
                  const buyHint = txType === "BUY" && (!groupOk || blockedStock || blockedSector || s.isTradable === false);
                  return {
                    value: s.id,
                    label: `${s.ticker} — ${s.companyName} · ${translatedShariahGroup(s.shariahGroup, t)}${buyHint ? ` · ${t("customerDetail.mayBeBlocked")}` : ""}`,
                  };
                }),
              ]}
            />
            {selected && (
              <p className="text-xs text-muted-foreground font-mono">
                {translatedShariahGroup(selected.shariahGroup, t)} · {selected.sector || t("common.na")}
                {selected.isTradable === false ? ` · ${t("customerDetail.notTradable")}` : ""}
              </p>
            )}
            {txType === "SELL" && stockId && (
              <p className="text-xs text-muted-foreground font-mono">{t("customerDetail.heldShares", { qty: heldQty.toLocaleString() })}</p>
            )}
            {eligibilityLoading && stockId && (
              <p className="text-xs text-muted-foreground font-mono">{t("customerDetail.checkingEligibility")}</p>
            )}
            {notEligible && (
              <p className="text-sm text-rose-500 font-mono">{eligibility?.message || t("customerDetail.notEligibleBuy")}</p>
            )}
            {eligibility?.allowed && (eligibility.warnings?.length ?? 0) > 0 && (
              <p className="text-xs text-amber-400 font-mono">{eligibility.message}</p>
            )}
            {mandateBlocked && (
              <p className="text-sm text-rose-500 font-mono">{t("customerDetail.mandateMustBeApproved")}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{t("common.quantity")}</Label>
              <Input type="number" step="any" min="0" placeholder="100" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-mono">{isClientTransfer ? t("customerDetail.costPricePerShare") : t("customerDetail.pricePerShare")}</Label>
              <Input
                type="number"
                step="any"
                min="0"
                disabled={priceLoading || (!isClientTransfer && (!!priceError || closePrice == null))}
                value={priceLoading ? "" : priceInput}
                placeholder={priceLoading ? t("common.loading") : isClientTransfer ? t("customerDetail.closeOrTypePrice") : t("customerDetail.fillPrice")}
                onChange={(e) => setPriceInput(e.target.value)}
                className="font-mono"
              />
              {isClientTransfer && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  {t("customerDetail.transferPriceHint")}
                </p>
              )}
              {!isClientTransfer && dayLow != null && dayHigh != null ? (
                <p className="text-[11px] text-muted-foreground font-mono">
                  {t("customerDetail.allowedRange", {
                    low: dayLow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
                    high: dayHigh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
                  })}
                  {closePrice != null ? t("customerDetail.closeSuffix", { close: closePrice }) : ""}
                </p>
              ) : !isClientTransfer && closePrice != null && !priceLoading && !priceError ? (
                <p className="text-[11px] text-muted-foreground font-mono">
                  {t("customerDetail.noDayHighLow")}
                  {t("customerDetail.closeSuffix", { close: closePrice })}
                </p>
              ) : isClientTransfer && closePrice != null ? (
                <p className="text-[11px] text-muted-foreground font-mono">
                  {t("customerDetail.closeOnDate", { date: priceSourceDate || txDate, close: closePrice })}
                </p>
              ) : null}
              {priceSourceDate && priceSourceDate !== txDate && (
                <p className="text-[11px] text-amber-400 font-mono">{t("customerDetail.marketDayUsed", { date: priceSourceDate })}</p>
              )}
              {outOfRange && (
                <p className="text-[11px] text-rose-500 font-mono">{t("customerDetail.priceOutOfRange")}</p>
              )}
              {priceError && <p className="text-[11px] text-rose-500 font-mono">{priceError}</p>}
              {closePrice != null && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-[11px] text-gold hover:underline font-mono justify-start"
                  onClick={() => setPriceInput(String(closePrice))}
                >
                  {t("customerDetail.useCloseOf", { date: priceSourceDate || txDate, close: closePrice })}
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-mono">{isClientTransfer ? t("customerDetail.postDate") : t("customerDetail.transactionDate")}</Label>
            <DatePicker value={txDate} onChange={setTxDate} />
          </div>
          {tradeAmount > 0 && (
            <div className="space-y-1 bg-muted/50 p-3 rounded text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isClientTransfer ? t("customerDetail.bookedCostNoCash") : t("customerDetail.tradeAmount")}</span>
                <span className="font-bold">{formatCurrency(tradeAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isClientTransfer ? t("customerDetail.cashAfterUnchanged") : t("customerDetail.cashAfterTrade")}</span>
                <span className={`font-bold ${projectedCash < 0 ? "text-rose-500" : ""}`}>{formatCurrency(projectedCash)}</span>
              </div>
            </div>
          )}
          {insufficientCash && (
            <p className="text-sm text-rose-500 font-mono">{t("customerDetail.insufficientCash")}</p>
          )}
          {insufficientShares && (
            <p className="text-sm text-rose-500 font-mono">{t("customerDetail.insufficientShares")}</p>
          )}
          <Button className="w-full" onClick={() => createMut.mutate()} disabled={!canSubmit || createMut.isPending}>
            {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Plus className="w-4 h-4 me-2" />}
            {txType === "CLIENT_TRANSFER"
              ? t("customerDetail.recordClientTransfer")
              : txType === "BUY"
                ? t("customerDetail.recordBuy")
                : t("customerDetail.recordSell")}
          </Button>
          {createMut.isError && <p className="text-sm text-rose-500 font-mono">{(createMut.error as Error).message}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BulkUploadDialog({ portfolioId, queryClient }: { portfolioId: string; queryClient: ReturnType<typeof useQueryClient> }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{
    count: number;
    inserted: string[];
    errors: string[];
    skippedRemaining?: number;
    stoppedAt?: string | null;
    bypassHighLow?: boolean;
    corporateActionsApplied?: { ticker: string; actionType: string; actionDate: string; cashCredited: number; qtyDelta: number }[];
  } | null>(null);

  const uploadMut = useMutation({
    mutationFn: (bypassHighLow: boolean) => bulkUploadTransactions(portfolioId, uploadFile!, { bypassHighLow }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-cash", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-holdings", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["fee-charges"] });
      queryClient.invalidateQueries({ queryKey: ["fee-summary"] });
      queryClient.invalidateQueries({ queryKey: ["fee-pending"] });
      setResult(data);
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="cdp-upload"><Upload className="w-4 h-4 me-1" /> {t("customerDetail.bulkUploadBtn")}</Button>
      </DialogTrigger>
      <DialogContent className="cdp-modal flex max-h-[90vh] flex-col gap-4 overflow-hidden sm:max-w-[560px]">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("customerDetail.bulkUploadTitle")}</DialogTitle>
          <DialogDescription>
            {t("customerDetail.bulkUploadDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-1 pe-1">
          <Button variant="outline" size="sm" className="w-full" onClick={() => downloadTransactionTemplate()}>
            <Download className="w-4 h-4 me-2" /> {t("common.downloadTemplate")}
          </Button>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-mono">{t("customerDetail.excelFile")}</Label>
            <Input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button onClick={() => uploadMut.mutate(false)} disabled={!uploadFile || uploadMut.isPending}>
              {uploadMut.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Upload className="w-4 h-4 me-2" />}
              {t("customerDetail.uploadProcess")}
            </Button>
            <Button variant="secondary" onClick={() => uploadMut.mutate(true)} disabled={!uploadFile || uploadMut.isPending}>
              {uploadMut.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {t("customerDetail.bypassHighLow")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("customerDetail.bypassHint")}
          </p>
          {uploadMut.isError && (
            <p className="text-sm text-rose-500 font-mono break-words">{(uploadMut.error as Error).message}</p>
          )}
          {result && (
            <div className="space-y-3 rounded border border-border/70 bg-muted/50 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-bold text-emerald-500">{t("customerDetail.processedTx", { count: result.count })}</p>
                {result.bypassHighLow && (
                  <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-600">
                    {t("customerDetail.highLowBypassed")}
                  </span>
                )}
                {result.errors.length > 0 && (
                  <span className="rounded bg-rose-500/15 px-2 py-0.5 font-mono text-xs font-bold text-rose-500">
                    {result.errors.length === 1
                      ? t("customerDetail.validationIssue", { count: result.errors.length })
                      : t("customerDetail.validationIssues", { count: result.errors.length })}
                  </span>
                )}
                {(result.skippedRemaining ?? 0) > 0 && (
                  <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-600">
                    {result.skippedRemaining === 1
                      ? t("customerDetail.rowsNotProcessed", { count: result.skippedRemaining })
                      : t("customerDetail.rowsNotProcessedPlural", { count: result.skippedRemaining })}
                  </span>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="font-mono text-xs font-bold text-rose-500">{t("customerDetail.errorsScroll")}</p>
                  <div className="max-h-52 overflow-y-auto overflow-x-hidden rounded border border-rose-500/20 bg-background/60 p-2 font-mono text-xs text-rose-500">
                    {result.errors.map((e, i) => (
                      <p key={i} className="break-words py-0.5 leading-relaxed">• {e}</p>
                    ))}
                  </div>
                </div>
              )}
              {result.inserted.length > 0 && (
                <div className="space-y-1">
                  <p className="font-mono text-xs font-bold text-emerald-500">{t("customerDetail.inserted", { count: result.inserted.length })}</p>
                  <div className="max-h-32 overflow-y-auto overflow-x-hidden rounded border border-emerald-500/20 bg-background/60 p-2 font-mono text-xs text-emerald-500">
                    {result.inserted.map((s, i) => (
                      <p key={i} className="break-words py-0.5">• {s}</p>
                    ))}
                  </div>
                </div>
              )}
              {result.corporateActionsApplied && result.corporateActionsApplied.length > 0 && (
                <div className="space-y-1">
                  <p className="font-mono text-xs font-bold text-sky-500">{t("customerDetail.corporateActionsApplied")}</p>
                  <div className="max-h-32 overflow-y-auto overflow-x-hidden rounded border border-sky-500/20 bg-background/60 p-2 font-mono text-xs text-sky-500">
                    {result.corporateActionsApplied.map((c, i) => (
                      <p key={i} className="break-words py-0.5">
                        • {t("customerDetail.caOnDate", { ticker: c.ticker, actionType: c.actionType, actionDate: c.actionDate })}
                        {c.cashCredited > 0 ? t("customerDetail.caCashCredited", { amount: c.cashCredited.toFixed(2) }) : ""}
                        {c.qtyDelta !== 0 ? t("customerDetail.caQtyDelta", { delta: `${c.qtyDelta > 0 ? "+" : ""}${c.qtyDelta}` }) : ""}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FiLotsPanel({ portfolioId }: { portfolioId: string }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const { data: lots = [] } = useQuery({
    queryKey: ["fi-lots", portfolioId],
    queryFn: () => getFiPortfolioLots(portfolioId),
  });
  const paging = useClientTablePage(lots, String(lots.length));
  const rebuildMut = useMutation({
    mutationFn: () => rebuildFiPortfolioDailyPnl(portfolioId),
    onSuccess: () => client.invalidateQueries({ queryKey: ["fi-lots", portfolioId] }),
  });
  if (!lots.length) {
    return (
      <EmptyState
        title={t("customerDetail.noFiLotsTitle")}
        description={t("customerDetail.noFiLotsDesc")}
      />
    );
  }
  return (
    <AppTable
      footer={<ClientTableFooter paging={paging} />}
      toolbar={
        <div className="clients-table-toolbar">
          <div>
            <p className="text-[15px] font-bold tracking-[-0.01em] text-[var(--shell-ink)]">{t("customerDetail.fiLotsTitle")}</p>
            <p className="mt-0.5 text-[12px] text-[var(--shell-muted)]">{t("customerDetail.fiLotsDesc")}</p>
          </div>
          <Button className="ms-auto" size="sm" variant="outline" disabled={rebuildMut.isPending} onClick={() => rebuildMut.mutate()}>
            {t("customerDetail.rebuildDailyPnl")}
          </Button>
        </div>
      }
    >
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.ticker")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
              <TableHead className="text-end">{t("customerDetail.face")}</TableHead>
              <TableHead className="text-end">{t("customerDetail.book")}</TableHead>
              <TableHead className="text-end">{t("customerDetail.market")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paging.paged.map((lot: any) => (
              <TableRow key={lot.id}>
                <TableCell className="font-mono font-semibold">{lot.ticker}</TableCell>
                <TableCell className="capitalize">{lot.status}</TableCell>
                <TableCell className="text-end font-data">{formatCurrency(Number(lot.faceAmount))}</TableCell>
                <TableCell className="text-end font-data">{lot.latestPnl ? formatCurrency(Number(lot.latestPnl.bookValue)) : t("common.na")}</TableCell>
                <TableCell className="text-end font-data">{lot.latestPnl?.marketValue != null ? formatCurrency(Number(lot.latestPnl.marketValue)) : t("common.na")}</TableCell>
                <TableCell>
                  <Link href={`/fixed-income/lots/${portfolioId}/${lot.id}`} className="soft-link text-gold">{t("customerDetail.dailyPnlLink")}</Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
    </AppTable>
  );
}

function cashFlowSign(type: string): number {
  return ["withdrawal", "fee", "trade_buy"].includes(type) ? -1 : 1;
}

const CASH_TYPE_KEYS: Record<string, string> = {
  deposit: "customerDetail.cashTypeDeposit",
  withdrawal: "customerDetail.cashTypeWithdrawal",
  fee: "customerDetail.cashTypeFee",
  dividend: "customerDetail.cashTypeDividend",
  adjustment: "customerDetail.cashTypeAdjustment",
  coupon: "customerDetail.cashTypeCoupon",
  maturity_principal: "customerDetail.cashTypeMaturityPrincipal",
  commission_rebate: "customerDetail.cashTypeCommissionRebate",
  trade_buy: "customerDetail.cashTypeTradeBuy",
  trade_sell: "customerDetail.cashTypeTradeSell",
};

function cashTypeLabel(type: string, t: (key: string) => string) {
  const key = CASH_TYPE_KEYS[type];
  return key ? t(key) : type;
}

function cashRowLockedReason(e: { type?: string; stockTransactionId?: string | null; corporateActionId?: string | null }, t: (key: string) => string): string | null {
  if (e.stockTransactionId || e.type === "trade_buy" || e.type === "trade_sell") {
    return t("customerDetail.cashLockedTrade");
  }
  if (e.corporateActionId) {
    return t("customerDetail.cashLockedCa");
  }
  return null;
}

function CashTransactionsTab({
  portfolioId,
  cash,
  queryClient,
  loading = false,
}: {
  portfolioId: string;
  cash: any;
  queryClient: ReturnType<typeof useQueryClient>;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const { role, username } = useAuth();
  const canCash = canPerformAction("cash.mutate", { role, username });
  const [manualCashOpen, setManualCashOpen] = useState(false);
  const todayIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Qatar" });
  const [cashType, setCashType] = useState("deposit");
  const [cashAmount, setCashAmount] = useState("");
  const [cashDate, setCashDate] = useState(todayIso);
  const [cashNote, setCashNote] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const ledger = (cash?.ledger || cash?.entries || []) as any[];

  const rowsWithBalance = useMemo(() => {
    const chronological = [...ledger].sort((a, b) => {
      const da = String(a.tradeDate || "");
      const db = String(b.tradeDate || "");
      if (da !== db) return da.localeCompare(db);
      const ca = new Date(a.createdAt || 0).getTime();
      const cb = new Date(b.createdAt || 0).getTime();
      if (ca !== cb) return ca - cb;
      return String(a.id).localeCompare(String(b.id));
    });
    let bal = 0;
    const afterById = new Map<string, number>();
    for (const e of chronological) {
      bal = Math.round((bal + cashFlowSign(String(e.type)) * Number(e.amount || 0)) * 10000) / 10000;
      afterById.set(e.id, bal);
    }
    // Newest first for display
    return [...chronological]
      .reverse()
      .map((e) => ({ ...e, balanceAfter: afterById.get(e.id) ?? null }));
  }, [ledger]);

  // Filtering/search happens after balanceAfter is computed on the full chronological
  // ledger above, so "Balance after" stays correct even when the table view is filtered.
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rowsWithBalance.filter((e: any) => {
      if (typeFilter && e.type !== typeFilter) return false;
      const d = String(e.tradeDate || "").slice(0, 10);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      if (q) {
        const haystack = `${e.notes || ""} ${e.reference || ""} ${cashTypeLabel(e.type, t)} ${e.type}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rowsWithBalance, search, typeFilter, fromDate, toDate, t]);

  const hasActiveFilters = !!(search || typeFilter || fromDate || toDate);
  const deletableIds = filteredRows.filter((e: any) => !cashRowLockedReason(e, t)).map((e: any) => e.id);
  const allDeletableSelected = deletableIds.length > 0 && deletableIds.every((id) => selectedIds.includes(id));

  const refreshCash = () => {
    queryClient.invalidateQueries({ queryKey: ["portfolio-cash"] });
    queryClient.invalidateQueries({ queryKey: ["phase1-portfolio", portfolioId] });
    queryClient.invalidateQueries({ queryKey: ["customer"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const cashMut = useMutation({
    mutationFn: () => addPortfolioCash(portfolioId, {
      type: cashType,
      amount: Number(cashAmount),
      tradeDate: cashDate || todayIso(),
      notes: cashNote || undefined,
    }),
    onSuccess: () => {
      setCashAmount("");
      setCashNote("");
      setCashType("deposit");
      setCashDate(todayIso());
      setError("");
      setManualCashOpen(false);
      refreshCash();
    },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (cashId: string) => deletePortfolioCash(portfolioId, cashId),
    onSuccess: () => {
      setSelectedIds((prev) => prev.filter((x) => x !== deleteTarget?.id));
      setDeleteTarget(null);
      setError("");
      refreshCash();
    },
    onError: (e: Error) => setError(e.message),
  });
  const bulkDeleteMut = useMutation({
    mutationFn: () => bulkDeletePortfolioCash(portfolioId, selectedIds),
    onSuccess: (result) => {
      setBulkOpen(false);
      setSelectedIds([]);
      refreshCash();
      if (result?.errors?.length) {
        setError(result.errors.join("; "));
      }
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <>
      <div className="cdp-table-head">
        <div className="cdp-table-title">
          <b id="cash-ledger">{t("customerDetail.cashLedgerTitle")}</b>
          <span>{t("customerDetail.cashLedgerBalance", { balance: formatCurrency(Number(cash?.balance || 0)), count: ledger.length })}</span>
        </div>
        <div className="cdp-actions">
          {canCash && selectedIds.length > 0 && (
            <Button size="sm" variant="destructive" onClick={() => setBulkOpen(true)}>
              <Trash2 className="w-4 h-4 me-1" /> {t("customerDetail.deleteSelected", { count: selectedIds.length })}
            </Button>
          )}
        {canCash && (
        <Dialog open={manualCashOpen} onOpenChange={(v) => { setManualCashOpen(v); if (v) { setCashDate(todayIso()); setError(""); } else { setError(""); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="cdp-add">
              <Plus className="me-1.5 h-3.5 w-3.5" /> {t("customerDetail.addManualCash")}
            </Button>
          </DialogTrigger>
          <DialogContent className="cdp-modal sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>{t("customerDetail.addManualCash")}</DialogTitle>
              <DialogDescription>
                {t("customerDetail.addManualCashDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("common.type")}</Label>
                <SelectField
                  className="w-full"
                  value={cashType}
                  onValueChange={setCashType}
                  options={[
                    { value: "deposit", label: t("customerDetail.cashTypeDeposit") },
                    { value: "withdrawal", label: t("customerDetail.cashTypeWithdrawal") },
                    { value: "fee", label: t("customerDetail.cashTypeFee") },
                    { value: "dividend", label: t("customerDetail.cashTypeDividend") },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("common.date")}</Label>
                <DatePicker value={cashDate} onChange={setCashDate} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("customerDetail.qarAmount")}</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-mono">{t("customerDetail.referenceNoteOptional")}</Label>
                <Input
                  placeholder={t("customerDetail.referenceNotePlaceholder")}
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!cashAmount || !cashDate || cashMut.isPending}
                onClick={() => cashMut.mutate()}
                title={t("customerDetail.postCashTitle")}
              >
                {cashMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Plus className="me-2 h-4 w-4" />}
                {t("customerDetail.post")}
              </Button>
              {error && <p className="text-sm text-rose-500 font-mono">{error}</p>}
            </div>
          </DialogContent>
        </Dialog>
        )}
        </div>
      </div>

      <FilterBar className="cdp-filter-row mb-4 mx-5">
        <Input
          className="min-w-0"
          placeholder={t("customerDetail.searchCashPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectField
          className="w-full min-w-0"
          value={typeFilter}
          onValueChange={setTypeFilter}
          options={[
            { value: "", label: t("customerDetail.allTypes") },
            ...Object.keys(CASH_TYPE_KEYS).map((value) => ({ value, label: cashTypeLabel(value, t) })),
          ]}
        />
        <DateRangePicker
          from={fromDate}
          to={toDate}
          onChange={({ from, to }) => {
            setFromDate(from);
            setToDate(to);
          }}
        />
        <div className="cdp-filter-end">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={() => { setSearch(""); setTypeFilter(""); setFromDate(""); setToDate(""); }}
            >
              {t("common.clearFilters")}
            </Button>
          )}
          <span className="text-xs text-muted-foreground font-mono">
            {t("customerDetail.entriesOf", { filtered: filteredRows.length, total: rowsWithBalance.length })}
          </span>
        </div>
      </FilterBar>

      {(error || deleteMut.isError || bulkDeleteMut.isError) && (
        <p className="mb-3 text-sm text-rose-500 font-mono">
          {error || (deleteMut.error as Error | undefined)?.message || (bulkDeleteMut.error as Error | undefined)?.message}
        </p>
      )}
      <div className="cdp-table-wrap">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allDeletableSelected}
                  disabled={deletableIds.length === 0}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedIds(deletableIds);
                    else setSelectedIds([]);
                  }}
                  aria-label={t("customerDetail.selectAllCashAria")}
                />
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider">{t("common.date")}</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider">{t("common.type")}</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider">{t("customerDetail.referenceNotes")}</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-end">{t("common.amount")}</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-end">{t("customerDetail.balanceAfter")}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeletonRows cols={7} rows={6} />
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-4 hover:bg-transparent">
                  <EmptyState
                    title={rowsWithBalance.length === 0 ? t("customerDetail.noCashYetTitle") : t("customerDetail.noMatchingCashTitle")}
                    description={rowsWithBalance.length === 0 ? t("customerDetail.noCashYetDesc") : t("customerDetail.noMatchingCashDesc")}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((e: any) => {
                const signed = cashFlowSign(String(e.type)) * Number(e.amount || 0);
                const locked = cashRowLockedReason(e, t);
                const typeLabel = cashTypeLabel(e.type, t);
                return (
                  <TableRow key={e.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(e.id)}
                        disabled={!!locked}
                        title={locked || undefined}
                        onCheckedChange={(checked) => {
                          if (locked) return;
                          setSelectedIds((prev) => checked ? [...prev, e.id] : prev.filter((id) => id !== e.id));
                        }}
                        aria-label={t("customerDetail.selectCashAria", { type: typeLabel })}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {new Date(e.tradeDate || e.createdAt || Date.now()).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs ${
                          signed >= 0
                            ? "border-[color-mix(in_srgb,var(--color-positive)_35%,transparent)] bg-[var(--color-positive-soft)] text-gain"
                            : "border-[color-mix(in_srgb,var(--color-negative)_35%,transparent)] bg-[var(--color-negative-soft)] text-loss"
                        }`}
                      >
                        {typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate" title={e.notes || e.reference || undefined}>
                      {e.notes || e.reference || t("common.na")}
                    </TableCell>
                    <TableCell className={`text-end font-data font-bold ${signed >= 0 ? "text-gain" : "text-loss"}`}>
                      {signed >= 0 ? "+" : "−"}{formatCurrency(Math.abs(signed))}
                    </TableCell>
                    <TableCell className={`text-end font-data cdp-col-mv`}>
                      {e.balanceAfter != null ? formatCurrency(Number(e.balanceAfter)) : t("common.na")}
                    </TableCell>
                    <TableCell className="text-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="cdp-delete"
                        disabled={!!locked}
                        title={locked || t("customerDetail.deleteCashEntryTitle")}
                        onClick={() => setDeleteTarget(e)}
                        aria-label={t("customerDetail.deleteCashAria", { type: typeLabel })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("customerDetail.deleteCashEntryConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `${t("customerDetail.deleteCashEntryDesc", {
                    type: cashTypeLabel(deleteTarget.type, t),
                    amount: formatCurrency(Math.abs(Number(deleteTarget.amount || 0))),
                    date: String(deleteTarget.tradeDate || "").slice(0, 10),
                  })}${deleteTarget.type === "deposit" || deleteTarget.type === "withdrawal" ? t("customerDetail.deleteCashEntryHwm") : ""}`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMut.mutate(deleteTarget.id);
              }}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedIds.length === 1
                ? t("customerDetail.deleteCashBulkTitle", { count: selectedIds.length })
                : t("customerDetail.deleteCashBulkTitlePlural", { count: selectedIds.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("customerDetail.deleteCashBulkDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMut.isPending}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                bulkDeleteMut.mutate();
              }}
            >
              {bulkDeleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("customerDetail.deleteCount", { count: selectedIds.length })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function CustomerDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [timeRange, setTimeRange] = useState("3M");
  const [qeriRange, setQeriRange] = useState("1Y");
  const [activeTab, setActiveTab] = useState("overview");
  const [asOf, setAsOf] = useState(todayQatarIso);
  const [asOfInput, setAsOfInput] = useState(todayQatarIso);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransactionData | null>(null);
  const queryClient = useQueryClient();
  const today = todayQatarIso();
  const viewingPast = asOf < today;

  const { data: customer, isLoading: custLoading, isFetching: custFetching, isPlaceholderData: custPlaceholder, error: custError } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomer(id!, undefined, true),
    enabled: !!id,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const { data: portfolio, isPending: portPending, isFetching: portFetching, isPlaceholderData: portPlaceholder } = useQuery({
    queryKey: ["portfolio", id && customer ? customer.portfolioId : null, asOf],
    queryFn: () => getPortfolio(customer!.portfolioId, asOf),
    enabled: !!id && !!customer?.portfolioId,
    placeholderData: keepPreviousData,
  });

  const { data: transactions = [], isFetching: txsFetching, isPlaceholderData: txsPlaceholder } = useQuery({
    queryKey: ["transactions", id && customer ? customer.portfolioId : null, asOf],
    queryFn: () => getTransactions(customer!.portfolioId, undefined, asOf),
    enabled: !!id && !!customer?.portfolioId && activeTab === "transactions",
    placeholderData: keepPreviousData,
  });

  const { data: cashLedger, isPending: cashPending, isFetching: cashFetching, isPlaceholderData: cashPlaceholder } = useQuery({
    queryKey: ["portfolio-cash", id && customer ? customer.portfolioId : null, asOf],
    queryFn: () => getPortfolioCash(customer!.portfolioId, asOf),
    enabled: !!id && !!customer?.portfolioId && activeTab === "cash",
    placeholderData: keepPreviousData,
  });

  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: getStocks,
    enabled: activeTab === "transactions",
  });

  const { data: headerMandate } = useQuery({
    queryKey: ["mandate", id],
    queryFn: () => getMandate(id!),
    enabled: !!id,
    retry: false,
  });

  const refreshBooks = () => {
    queryClient.invalidateQueries({ queryKey: ["customer", id] });
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio-cash"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio-holdings"] });
    queryClient.invalidateQueries({ queryKey: ["phase1-portfolio"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  };

  const deleteMut = useMutation({
    mutationFn: (txId: string) => deleteTransaction(txId),
    onSuccess: () => {
      setDeleteTarget(null);
      setSelectedTxIds((prev) => prev.filter((x) => x !== deleteTarget?.id));
      refreshBooks();
    },
  });
  const bulkDeleteMut = useMutation({
    mutationFn: () => bulkDeleteTransactions(customer!.portfolioId, selectedTxIds),
    onSuccess: () => {
      setBulkOpen(false);
      setSelectedTxIds([]);
      refreshBooks();
    },
  });

  const booksRefreshing = !!(customer && (
    (custFetching && custPlaceholder) ||
    (portFetching && portPlaceholder)
  ));
  const booksPending = Boolean(customer?.portfolioId) && portPending;
  const booksLoading = booksPending || booksRefreshing;
  const cashRefreshing = !!(cashFetching && (cashPlaceholder || !cashLedger));
  const txsRefreshing = !!(txsFetching && (txsPlaceholder || transactions.length === 0));

  const allVisibleSelected = transactions.length > 0 && transactions.every((tx) => selectedTxIds.includes(tx.id));

  const perf = portfolio?.performance;
  const twar = portfolio?.twar || 0;
  const unrealizedPnL = (portfolio as any)?.unrealizedPnL || 0;
  const realizedPnL = (portfolio as any)?.realizedPnL || 0;
  const simpleMonthlyReturns = portfolio?.simpleMonthlyReturns || [];
  const indexMonthlyReturns = (portfolio as any)?.indexMonthlyReturns || null;

  const chartData = useMemo(() => {
    if (!perf) return [];
    const portMap = new Map(perf.portfolioSeries.map((p: any) => [p.date, p]));
    return perf.indexSeries.map((i: any) => ({
      date: i.date,
      portfolio: portMap.get(i.date)?.value || null,
      benchmark: i.value,
      portfolioNormalized: portMap.get(i.date)?.normalized || null,
      benchmarkNormalized: i.normalized,
    }));
  }, [perf]);

  const filterDays = timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : timeRange === '6M' ? 180 : timeRange === '1Y' ? 365 : chartData.length || 999;
  const filteredChartData = useMemo(() => chartData.slice(-filterDays), [chartData, filterDays]);
  const holdingsModel = useMemo(() => {
    if (!customer) return null;
    return buildClientHoldingsViewModel({
      customer,
      asOf,
      today,
      portfolio,
      cashLedger,
    });
  }, [customer, asOf, today, portfolio, cashLedger]);

  if (custLoading && !customer) {
    return (
      <Shell>
        <div className="cdp space-y-6 py-2" aria-busy>
          <header className="cdp-header">
            <div className="cdp-title space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-10 w-48 rounded-md" />
          </header>
          <WorkbookKpiBar nav={0} growthPct={null} gain={null} indexPct={null} loading />
          <Skeleton className="h-10 w-full max-w-3xl rounded-full" />
          <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(15rem,18rem)_minmax(0,1fr)]">
            <Skeleton className="h-[22rem] w-full rounded-xl" />
            <Skeleton className="h-[22rem] w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </Shell>
    );
  }

  if (custError || !customer) {
    return (
      <Shell>
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title={t("customerDetail.notFoundTitle")}
          description={t("customerDetail.notFoundDesc")}
          action={<Button asChild><Link href="/customers-old">{t("customerDetail.returnToClients")}</Link></Button>}
        />
      </Shell>
    );
  }

  return ( 
    <Shell>
      <div className="cdp text-start" dir={i18n.dir()}>
       

      <header className="cdp-header">
        <div className="cdp-title">
          <h1>{customer.name}</h1>
          <p>
            {t("historicalPortfolio.clientN")}:{" "}
            <bdi className="font-data" dir="ltr">
              {customer.accountNumber || customer.idNumber || customer.id.slice(0, 8)}
            </bdi>
          </p>
        </div>
        <div className="cdp-header-actions">
          <DatePicker
            className="cdp-date"
            prefix={t("historicalPortfolio.dateLabel")}
            value={asOfInput}
            onChange={(iso) => {
              const next = iso || today;
              setAsOfInput(next);
              setAsOf(next);
              setSelectedTxIds([]);
            }}
            max={today}
          />
          <ClientDetailsDialog customer={customer} iconOnly />
        </div>
      </header>
      {viewingPast && (
        <div className="cdp-warn">
          {t("customerDetail.viewingPast", { asOf })}
        </div>
      )}

      <WorkbookKpiBar
        nav={holdingsModel?.nav ?? 0}
        growthPct={holdingsModel?.excelGrowthPct}
        gain={holdingsModel?.excelGain}
        indexPct={holdingsModel?.indexPerformancePct}
        indexName={holdingsModel?.indexName}
        indexFromDate={holdingsModel?.indexFromDate}
        indexToDate={holdingsModel?.indexToDate}
        loading={booksLoading}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="cdp-data">
        <CdpTabsList value={activeTab}>
          <TabsTrigger value="overview" className={CDP_TAB}>{t("customerDetail.holdings")}</TabsTrigger>
          <TabsTrigger value="transactions" className={CDP_TAB}>{t("customerDetail.transactions")}</TabsTrigger>
          <TabsTrigger value="cash" className={CDP_TAB}>{t("customerDetail.cash")}</TabsTrigger>
          <TabsTrigger value="performance" className={CDP_TAB}>{t("customerDetail.performance")}</TabsTrigger>
          <TabsTrigger value="mandate" className={CDP_TAB}>{t("customerDetail.mandate")}</TabsTrigger>
          <TabsTrigger value="fees" className={CDP_TAB}>{t("customerDetail.fees")}</TabsTrigger>
          <TabsTrigger value="income" className={CDP_TAB}>{t("customerDetail.fixedIncome")}</TabsTrigger>
        </CdpTabsList>

        <TabsContent value="overview" className="cdp-pane mt-0 space-y-4">

        {holdingsModel ? (
          <ClientHoldingsStation
            model={holdingsModel}
            variant="table"
            loading={booksLoading}
          />
        ) : booksLoading ? (
          <ClientHoldingsStation
            model={emptyClientHoldingsViewModel()}
            variant="table"
            loading
          />
        ) : null}

        </TabsContent>

        <TabsContent value="performance" className="cdp-pane mt-0">
          <PerformanceAnalytics
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            qeriRange={qeriRange}
            onQeriRangeChange={setQeriRange}
            chartData={filteredChartData}
            simpleMonthlyReturns={simpleMonthlyReturns}
            indexMonthlyReturns={indexMonthlyReturns}
            twar={twar}
            unrealizedPnL={unrealizedPnL}
            realizedPnL={realizedPnL}
            asOf={asOf}
            loading={booksLoading}
          />
        </TabsContent>

        <TabsContent value="mandate" className="cdp-pane mt-0">
          <MandateControl
            customerId={customer.id}
            portfolioId={customer.portfolioId}
            asOf={asOf}
            onViewCash={() => setActiveTab("cash")}
            onViewHoldings={() => setActiveTab("overview")}
          />
        </TabsContent>

        <TabsContent value="fees" className="cdp-pane mt-0">
          <FeeBandsCard customerId={customer.id} portfolioId={customer.portfolioId} />
        </TabsContent>

        <TabsContent value="income" className="cdp-pane mt-0">
          <FiLotsPanel portfolioId={customer.portfolioId} />
        </TabsContent>

        <TabsContent value="transactions" className="cdp-pane mt-0">
          <div className="cdp-table-head">
            <div className="cdp-table-title">
              <span>{t("customerDetail.transactionLedgerSub", { count: transactions.length, asOf })}</span>
            </div>
            <div className="cdp-actions">
              {selectedTxIds.length > 0 && (
                <Button size="sm" variant="destructive" onClick={() => setBulkOpen(true)}>
                  <Trash2 className="w-4 h-4 me-1" /> {t("customerDetail.deleteSelected", { count: selectedTxIds.length })}
                </Button>
              )}
              <AddTransactionDialog portfolioId={customer.portfolioId} customerId={customer.id} stocks={stocks} queryClient={queryClient} />
              <BulkUploadDialog portfolioId={customer.portfolioId} queryClient={queryClient} />
            </div>
          </div>
          {(deleteMut.isError || bulkDeleteMut.isError) && (
            <p className="mb-3 text-sm text-rose-500 font-mono">
              {(deleteMut.error as Error | undefined)?.message || (bulkDeleteMut.error as Error | undefined)?.message}
            </p>
          )}
          <div className="cdp-table-wrap">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedTxIds(transactions.map((tx) => tx.id));
                        else setSelectedTxIds([]);
                      }}
                      aria-label={t("customerDetail.selectAllTxAria")}
                    />
                  </TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider">{t("common.date")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider">{t("common.stock")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider">{t("common.type")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-end">{t("common.quantity")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-end">{t("common.price")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-end">{t("customerDetail.total")}</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-end">{t("customerDetail.cashAfter")}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {txsRefreshing ? (
                  <TableSkeletonRows cols={9} />
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-4 hover:bg-transparent">
                      <EmptyState
                        title={t("customerDetail.noTxTitle")}
                        description={t("customerDetail.noTxDesc")}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx: TransactionData) => (
                    <TableRow key={tx.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Checkbox
                          checked={selectedTxIds.includes(tx.id)}
                          onCheckedChange={(checked) => {
                            setSelectedTxIds((prev) => checked ? [...prev, tx.id] : prev.filter((id) => id !== tx.id));
                          }}
                          aria-label={t("customerDetail.selectTxAria", { ticker: tx.stock?.ticker || tx.stockId, type: tx.type })}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="cdp-stock">
                          <b>{tx.stock?.ticker || tx.stockId}</b>
                          <span>{tx.stock?.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "cdp-type",
                          tx.type === "BUY" && "is-buy",
                          tx.type === "SELL" && "is-sell",
                          tx.type === "CLIENT_TRANSFER" && "is-xfer",
                        )}>
                          {tx.type === "CLIENT_TRANSFER" ? t("customerDetail.inKindTransfer") : tx.type}
                        </span>
                      </TableCell>
                      <TableCell className={cn("text-end font-data", txNumClass(tx.type))}>{Number(tx.quantity).toLocaleString()}</TableCell>
                      <TableCell className={cn("text-end font-data", txNumClass(tx.type))}>{formatCurrency(Number(tx.price))}</TableCell>
                      <TableCell className={cn("text-end font-data font-bold", txNumClass(tx.type))}>{formatCurrency(Number(tx.quantity) * Number(tx.price))}</TableCell>
                      <TableCell className="text-end font-data cdp-col-mv">
                        {tx.cashBalanceAfter != null && tx.cashBalanceAfter !== ""
                          ? formatCurrency(Number(tx.cashBalanceAfter))
                          : t("common.na")}
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="cdp-delete"
                          onClick={() => setDeleteTarget(tx)}
                          aria-label={t("customerDetail.deleteTxAria", { ticker: tx.stock?.ticker || "", type: tx.type })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("customerDetail.deleteTradeConfirm")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteTarget
                    ? deleteTarget.type === "CLIENT_TRANSFER"
                      ? t("customerDetail.deleteTradeDescTransfer", {
                          qty: Number(deleteTarget.quantity).toLocaleString(),
                          ticker: deleteTarget.stock?.ticker || "",
                          price: formatCurrency(Number(deleteTarget.price)),
                        })
                      : t("customerDetail.deleteTradeDescBuySell", {
                          type: deleteTarget.type,
                          qty: Number(deleteTarget.quantity).toLocaleString(),
                          ticker: deleteTarget.stock?.ticker || "",
                          price: formatCurrency(Number(deleteTarget.price)),
                        })
                    : ""}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMut.isPending}>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteMut.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    if (deleteTarget) deleteMut.mutate(deleteTarget.id);
                  }}
                >
                  {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {selectedTxIds.length === 1
                    ? t("customerDetail.deleteTradesBulkTitle", { count: selectedTxIds.length })
                    : t("customerDetail.deleteTradesBulkTitlePlural", { count: selectedTxIds.length })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("customerDetail.deleteTradesBulkDesc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={bulkDeleteMut.isPending}>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={bulkDeleteMut.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    bulkDeleteMut.mutate();
                  }}
                >
                  {bulkDeleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("customerDetail.deleteCount", { count: selectedTxIds.length })}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        <TabsContent value="cash" className="cdp-pane mt-0">
        <CashTransactionsTab
          portfolioId={customer.portfolioId}
          cash={cashLedger}
          queryClient={queryClient}
          loading={cashPending || cashRefreshing}
        />
        </TabsContent>
      </Tabs>
      </div>
    </Shell>
  );
}
