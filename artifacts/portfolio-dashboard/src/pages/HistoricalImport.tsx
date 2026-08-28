import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, Redirect } from "wouter";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileSpreadsheet, Loader2, Pencil, Plus, Upload } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { EmptyState } from "@/components/phase1/PageHeader";
import { CDP_TAB, CdpTabsList } from "@/components/phase1/CdpTabs";
import { IdentityFacts, SheetIssueList, SheetPreviewGrid } from "@/components/phase1/SheetPreviewGrid";
import { ClientHoldingsStation } from "@/components/phase1/ClientHoldingsStation";
import { DatePicker } from "@/components/phase1/DatePicker";
import { buildClientHoldingsViewModel, emptyClientHoldingsViewModel } from "@/lib/clientHoldingsModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppTable, ClientTableFooter, useClientTablePage } from "@/components/phase1/DataTableCard";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocale } from "@/i18n/LocaleProvider";
import { useAuth } from "@/lib/AuthContext";
import { isSuperAdmin } from "@/lib/superAdmin";
import {
  commitHistoricalSheet,
  createCustomer,
  deleteCustomer,
  getCustomers,
  getCustomer,
  getHistoricalImportCatalog,
  getHistoricalImports,
  getPhase1Portfolio,
  getPortfolio,
  getPortfolioCash,
  previewHistoricalPortfolio,
  updateCustomer,
  validateHistoricalSheet,
  type HistoricalSheetKind,
  type HistoricalValidateResult,
  type SheetIdentity,
} from "@/lib/api";

type WizardTab = "clients" | "files" | "review" | "portfolio" | "market";
const WIZARD: WizardTab[] = ["clients", "files", "review", "portfolio", "market"];
const MARKET_KINDS: HistoricalSheetKind[] = ["securities", "prices", "indices"];
const todayQatarIso = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Qatar" });

/** Preview parses both broker workbooks — do not refetch on focus or name typing. */
const PORTFOLIO_VIEW_QUERY = {
  staleTime: 5 * 60_000,
  refetchOnWindowFocus: false as const,
  refetchOnReconnect: false as const,
  placeholderData: keepPreviousData,
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5 text-start">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function mergeIdentity(...parts: Array<SheetIdentity | undefined | null>): SheetIdentity {
  const out: SheetIdentity = { name: "", email: "", accountNumber: "", mobile: "", nin: "", notes: "" };
  for (const part of parts) {
    if (!part) continue;
    if (!out.name && part.name) out.name = part.name;
    if (!out.email && part.email) out.email = part.email;
    if (!out.accountNumber && part.accountNumber) out.accountNumber = part.accountNumber;
    if (!out.mobile && part.mobile) out.mobile = part.mobile;
    if (!out.nin && part.nin) out.nin = part.nin;
    if (!out.notes && part.notes) out.notes = part.notes;
  }
  return out;
}

/** Same fallback as backend `sanitizeClientEmail` — broker sheets often mask email. */
function importEmailFallback(email: string, accountNumber: string, notes: string) {
  const trimmed = email.replace(/\s+/g, "");
  if (trimmed.includes("@") && !/[x*]/i.test(trimmed)) return trimmed.slice(0, 300);
  const nin = notes.match(/NIN\s+(\S+)/i)?.[1];
  const key = (accountNumber || nin || "imported").replace(/\s+/g, "");
  return `client.${key}@qsc.local`;
}

function importNameFallback(name: string, accountNumber: string) {
  const trimmed = name.trim();
  if (trimmed) return trimmed;
  const account = accountNumber.trim();
  return account ? `Imported client ${account}` : "";
}

function WorkbookPicker({
  id,
  file,
  onFile,
}: {
  id: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = "";
  }, [file]);

  const pick = (list: FileList | null) => {
    onFile(list?.[0] || null);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        pick(event.dataTransfer.files);
      }}
      className={cn(
        "rounded-[16px] border border-dashed px-3 py-3 transition-colors",
        dragOver
          ? "border-[#8db0ff] bg-[#eef3fd]"
          : "border-[#c5d4f0] bg-[linear-gradient(145deg,#fff,#f7f9fe)]",
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept=".xls,.xlsx"
        className="sr-only"
        onChange={(event) => pick(event.target.files)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" className="cdp-add shrink-0" onClick={() => inputRef.current?.click()}>
          <Upload className="me-2 h-4 w-4" />
          {file ? t("historicalImport.changeFile") : t("historicalImport.chooseFile")}
        </Button>
        <p className="min-w-0 flex-1 truncate text-start text-sm font-medium text-[#2b3d67]">
          {file ? file.name : t("historicalImport.noFileChosen")}
        </p>
      </div>
      <p className="mt-2 text-start text-[11px] leading-relaxed text-[#50669a]">{t("historicalImport.dropWorkbook")}</p>
    </div>
  );
}

function SheetFileCard({
  id,
  title,
  hint,
  file,
  onFile,
}: {
  id: string;
  title: string;
  hint: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  return (
    <div className="space-y-2 rounded-[16px] border border-[#dfe6f6] bg-white/80 p-4 text-start">
      <h4 className="text-sm font-bold text-[#0e1837]">{title}</h4>
      <p className="text-xs leading-relaxed text-[#50669a]">{hint}</p>
      <WorkbookPicker id={id} file={file} onFile={onFile} />
    </div>
  );
}

export default function HistoricalImport() {
  const { t } = useTranslation();
  const { dir } = useLocale();
  const { username } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<WizardTab>("clients");
  const [customerId, setCustomerId] = useState("");
  const [creating, setCreating] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAccount, setEditAccount] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [tradesFile, setTradesFile] = useState<File | null>(null);
  const [cashFile, setCashFile] = useState<File | null>(null);
  const [tradesPreview, setTradesPreview] = useState<HistoricalValidateResult | null>(null);
  const [cashPreview, setCashPreview] = useState<HistoricalValidateResult | null>(null);
  const [marketKind, setMarketKind] = useState<HistoricalSheetKind>("securities");
  const [marketFile, setMarketFile] = useState<File | null>(null);
  const [marketPreview, setMarketPreview] = useState<HistoricalValidateResult | null>(null);
  const [replaceMarket, setReplaceMarket] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [asOf, setAsOf] = useState(todayQatarIso);

  const { data: catalog } = useQuery({ queryKey: ["historical-catalog"], queryFn: getHistoricalImportCatalog, ...PORTFOLIO_VIEW_QUERY });
  const { data: imports = [], isLoading: importsLoading } = useQuery({ queryKey: ["historical-imports"], queryFn: getHistoricalImports, ...PORTFOLIO_VIEW_QUERY });
  const { data: customers = [], isLoading: customersLoading } = useQuery({ queryKey: ["customers"], queryFn: getCustomers, ...PORTFOLIO_VIEW_QUERY });
  const customersPaging = useClientTablePage(customers, String(customers.length));
  const selectedCustomer = customers.find((c) => c.id === customerId);
  const marketSpec = catalog?.steps.find((s) => s.kind === marketKind);

  const latestBatch = (id: string, kind: HistoricalSheetKind) =>
    imports.find((row) => row.customerId === id && row.kind === kind && row.status === "committed");

  const resetProfile = () => {
    setCustomerId("");
    setCreating(true);
    setEditName("");
    setEditEmail("");
    setEditAccount("");
    setEditMobile("");
    setEditNotes("");
    setTradesFile(null);
    setCashFile(null);
    setTradesPreview(null);
    setCashPreview(null);
    setNotice("");
  };

  const hydrateClient = (id: string) => {
    const row = customers.find((c) => c.id === id);
    setCustomerId(id);
    setCreating(false);
    setEditName(row?.name || "");
    setEditEmail(row?.email || "");
    setEditAccount(row?.accountNumber || "");
    setEditMobile(row?.mobileNumber || "");
    setEditNotes(row?.notes || "");
    setNotice("");
  };

  const startAdd = () => {
    resetProfile();
    setTab("files");
  };

  const startEdit = (id: string) => {
    hydrateClient(id);
    setTab("clients");
  };

  const startView = (id: string) => {
    hydrateClient(id);
    setTab("portfolio");
  };

  const startReplaceFiles = (id: string) => {
    hydrateClient(id);
    setTradesFile(null);
    setCashFile(null);
    setTradesPreview(null);
    setCashPreview(null);
    setTab("files");
  };

  const validateMut = useMutation({
    mutationFn: async () => {
      if (!tradesFile || !cashFile) throw new Error(t("historicalImport.needBothFiles"));
      const [trades, cash] = await Promise.all([
        validateHistoricalSheet(tradesFile, "trades"),
        validateHistoricalSheet(cashFile, "cash"),
      ]);
      return { trades, cash };
    },
    onSuccess: (data) => {
      setTradesPreview(data.trades);
      setCashPreview(data.cash);
      const identity = mergeIdentity(data.trades.identity, data.cash.identity);
      const name = identity.name;
      const email = identity.email;
      const accountNumber = identity.accountNumber;
      const mobile = identity.mobile;
      const notes = identity.notes;
      const nin = identity.nin;
      if (accountNumber) setEditAccount((v) => v.trim() || accountNumber);
      if (name || accountNumber) setEditName((v) => v.trim() || importNameFallback(name, accountNumber));
      const notesForEmail = notes || (nin ? `NIN ${nin}` : "");
      setEditEmail((v) => v.trim() || importEmailFallback(email, accountNumber, notesForEmail));
      if (mobile) setEditMobile((v) => v.trim() || mobile);
      if (notes) setEditNotes((v) => v.trim() || notes);
      else if (nin) setEditNotes((v) => v.trim() || `NIN ${nin}`);
      setTab("review");
    },
  });

  const commitMut = useMutation({
    mutationFn: async () => {
      if (!tradesFile || !cashFile) throw new Error(t("historicalImport.needBothFiles"));
      const name = importNameFallback(editName, editAccount);
      const email = importEmailFallback(editEmail, editAccount, editNotes);
      if (!name) throw new Error(t("historicalImport.needClientName"));
      let id = customerId;
      if (!id) {
        const created = await createCustomer({
          name,
          email,
          accountNumber: editAccount.trim() || null,
          mobileNumber: editMobile.trim() || null,
          notes: editNotes.trim() || null,
        });
        id = created.id;
      } else {
        await updateCustomer(id, {
          name,
          email,
          accountNumber: editAccount.trim() || null,
          mobileNumber: editMobile.trim() || null,
          notes: editNotes.trim() || null,
        });
      }
      await commitHistoricalSheet(tradesFile, "trades", { replace: true, customerId: id });
      await commitHistoricalSheet(cashFile, "cash", { replace: true, customerId: id });
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["historical-imports"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-manager"] });
      queryClient.invalidateQueries({ queryKey: ["sheet-portfolio-preview"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["phase1-portfolio"] });
      hydrateClient(id);
      setTradesFile(null);
      setCashFile(null);
      setNotice(t("historicalImport.committedOk"));
      setTab("clients");
    },
  });

  const saveClientMut = useMutation({
    mutationFn: () => updateCustomer(customerId, {
      name: editName.trim(),
      email: editEmail.trim(),
      accountNumber: editAccount.trim() || null,
      mobileNumber: editMobile.trim() || null,
      notes: editNotes.trim() || null,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  const deleteClientMut = useMutation({
    mutationFn: () => deleteCustomer(deleteId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["historical-imports"] });
      if (deleteId === customerId) resetProfile();
      setDeleteId(null);
      setTab("clients");
    },
  });

  const marketValidateMut = useMutation({
    mutationFn: () => validateHistoricalSheet(marketFile!, marketKind),
    onSuccess: setMarketPreview,
  });
  const marketCommitMut = useMutation({
    mutationFn: () => commitHistoricalSheet(marketFile!, marketKind, { replace: replaceMarket }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historical-imports"] });
      setMarketPreview(null);
      setMarketFile(null);
    },
  });

  const filesReady = Boolean(tradesFile && cashFile);
  const reviewValid = Boolean(tradesPreview?.valid && cashPreview?.valid);
  const resolvedImportName = importNameFallback(editName, editAccount);
  const canCommit = reviewValid && filesReady && Boolean(resolvedImportName);
  const needsFilePreview = Boolean(tradesFile && cashFile && reviewValid);
  const today = useMemo(() => todayQatarIso(), []);
  const addClientLabel = t("historicalImport.addClient");

  const { data: sheetPreview, isPending: sheetPreviewPending, error: sheetPreviewError } = useQuery({
    queryKey: ["sheet-portfolio-preview", tradesFile?.name, tradesFile?.size, cashFile?.name, cashFile?.size, asOf],
    queryFn: () => previewHistoricalPortfolio(tradesFile!, cashFile!, { asOf }),
    enabled: tab === "portfolio" && needsFilePreview,
    ...PORTFOLIO_VIEW_QUERY,
  });

  const { data: liveCustomer, isPending: liveCustPending } = useQuery({
    queryKey: ["customer", customerId, asOf],
    queryFn: () => getCustomer(customerId, asOf),
    enabled: tab === "portfolio" && !!customerId && !needsFilePreview,
    ...PORTFOLIO_VIEW_QUERY,
  });
  const livePortfolioId = liveCustomer?.portfolioId;
  const { data: livePortfolio, isPending: livePortPending } = useQuery({
    queryKey: ["portfolio", livePortfolioId, asOf],
    queryFn: () => getPortfolio(livePortfolioId!, asOf),
    enabled: tab === "portfolio" && !!livePortfolioId && !needsFilePreview,
    ...PORTFOLIO_VIEW_QUERY,
  });
  const { data: livePhase1, isPending: livePhase1Pending } = useQuery({
    queryKey: ["phase1-portfolio", livePortfolioId, asOf],
    queryFn: () => getPhase1Portfolio(livePortfolioId!, asOf),
    enabled: tab === "portfolio" && !!livePortfolioId && !needsFilePreview,
    ...PORTFOLIO_VIEW_QUERY,
  });
  const { data: liveCash, isPending: liveCashPending } = useQuery({
    queryKey: ["portfolio-cash", livePortfolioId, asOf],
    queryFn: () => getPortfolioCash(livePortfolioId!, asOf),
    enabled: tab === "portfolio" && !!livePortfolioId && !needsFilePreview,
    ...PORTFOLIO_VIEW_QUERY,
  });

  const holdingsModel = useMemo(() => {
    if (needsFilePreview && sheetPreview) {
      return buildClientHoldingsViewModel({
        customer: {
          id: customerId || "preview",
          name: editName.trim() || sheetPreview.clientName || addClientLabel,
          accountNumber: editAccount.trim() || sheetPreview.clientCode,
          portfolioId: customerId || "",
        },
        asOf,
        today,
        preview: {
          ...sheetPreview,
          clientName: editName.trim() || sheetPreview.clientName,
          clientCode: editAccount.trim() || sheetPreview.clientCode,
        },
      });
    }
    if (liveCustomer) {
      return buildClientHoldingsViewModel({
        customer: liveCustomer,
        asOf,
        today,
        portfolio: livePortfolio,
        phase1: livePhase1,
        cashLedger: liveCash,
      });
    }
    return null;
  }, [needsFilePreview, sheetPreview, liveCustomer, livePortfolio, livePhase1, liveCash, customerId, editName, editAccount, asOf, today, addClientLabel]);

  const portfolioLoading = needsFilePreview
    ? sheetPreviewPending && !sheetPreview
    : Boolean(livePortfolioId) && (liveCustPending || livePortPending || livePhase1Pending || liveCashPending);

  if (!isSuperAdmin(username)) return <Redirect to="/" />;

  const profileFields = (
    <div className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={t("common.name")}>
        <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
      </Field>
      <Field label={t("common.email")}>
        <Input type="email" dir="ltr" className="text-start" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
      </Field>
      <Field label={t("historicalImport.clientCodeAccount")}>
        <Input dir="ltr" className="text-start" value={editAccount} onChange={(e) => setEditAccount(e.target.value)} />
      </Field>
      <Field label={t("customers.mobile")}>
        <Input value={editMobile} onChange={(e) => setEditMobile(e.target.value)} />
      </Field>
      <div className="sm:col-span-2">
        <Field label={t("common.notes")}>
          <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
        </Field>
      </div>
    </div>
  );

  return (
    <Shell>
      <div className="cdp" dir={dir}>
        <header className="cdp-header">
          <div className="cdp-title">
            <h1>{t("historicalImport.title")}</h1>
            <p>{t("historicalImport.description")}</p>
          </div>
        </header>

        <Tabs dir={dir} value={tab} onValueChange={(v) => setTab(v as WizardTab)} className="cdp-data">
          <CdpTabsList value={tab}>
            {WIZARD.map((step) => (
              <TabsTrigger
                key={step}
                value={step}
                className={CDP_TAB}
                disabled={
                  (step === "review" && !validateMut.isPending && !tradesPreview && !cashPreview) ||
                  (step === "portfolio" && !reviewValid && !customerId)
                }
              >
                {t(`historicalImport.wizard.${step}`)}
              </TabsTrigger>
            ))}
          </CdpTabsList>

          <TabsContent value="clients" className="cdp-pane mt-0 space-y-4">
            <div className="cdp-table-head">
              <div className="cdp-table-title">
                <b>{t("historicalImport.wizard.clients")}</b>
                <span>{t("historicalImport.emptyClientsDesc")}</span>
              </div>
              <div className="cdp-actions">
                <Button className="cdp-add" onClick={startAdd}>
                  <Plus className="me-2 h-4 w-4" />
                  {t("historicalImport.addClient")}
                </Button>
              </div>
            </div>

            {customerId && selectedCustomer ? (
              <section className="cdp-sectors !m-0 space-y-4">
                <header className="cdp-sectors-head">
                  <div>
                    <h3>{t("historicalImport.editClient")}</h3>
                    <p>{selectedCustomer.name}</p>
                  </div>
                </header>
                {profileFields}
                <div className="cdp-actions">
                  <Button className="cdp-add" size="sm" disabled={saveClientMut.isPending} onClick={() => saveClientMut.mutate()}>
                    {saveClientMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                    {t("historicalImport.saveClient")}
                  </Button>
                  <Button className="cdp-ghost-action" size="sm" variant="outline" onClick={() => startReplaceFiles(customerId)}>
                    {t("historicalImport.replaceFiles")}
                  </Button>
                  <Button size="sm" className="cdp-ghost-action" variant="outline" asChild>
                    <Link href={`/customers-old/${customerId}`}>{t("historicalImport.openAsOf")}</Link>
                  </Button>
                </div>
                {saveClientMut.isError ? (
                  <p className="font-mono text-sm text-rose-500">{(saveClientMut.error as Error).message}</p>
                ) : null}
                {notice ? <p className="text-sm text-[#1a4cc4]">{notice}</p> : null}
              </section>
            ) : null}

            {customersLoading || importsLoading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : customers.length === 0 ? (
              <EmptyState
                title={t("historicalImport.emptyClientsTitle")}
                description={t("historicalImport.emptyClientsDesc")}
                action={
                  <Button className="cdp-add" onClick={startAdd}>
                    <Plus className="me-2 h-4 w-4" />
                    {t("historicalImport.addClient")}
                  </Button>
                }
              />
            ) : (
              <AppTable footer={<ClientTableFooter paging={customersPaging} />}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("common.email")}</TableHead>
                      <TableHead>{t("historicalImport.clientCodeAccount")}</TableHead>
                      <TableHead>{t("historicalImport.tradesRows")}</TableHead>
                      <TableHead>{t("historicalImport.cashRows")}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customersPaging.paged.map((row) => {
                      const trades = latestBatch(row.id, "trades");
                      const cash = latestBatch(row.id, "cash");
                      return (
                        <TableRow
                          key={row.id}
                          className={row.id === customerId ? "cursor-pointer bg-[color-mix(in_srgb,var(--shell-blue)_6%,transparent)]" : "cursor-pointer"}
                          onClick={() => startView(row.id)}
                        >
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.email}</TableCell>
                          <TableCell className="font-mono text-xs">{row.accountNumber || t("common.na")}</TableCell>
                          <TableCell className="font-data tabular-nums">{trades?.rowCount ?? t("common.na")}</TableCell>
                          <TableCell className="font-data tabular-nums">{cash?.rowCount ?? t("common.na")}</TableCell>
                          <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex flex-wrap justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => startView(row.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => startEdit(row.id)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" asChild>
                                <Link href={`/customers-old/${row.id}`}>{t("historicalImport.openAsOf")}</Link>
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.id)}>
                                {t("common.delete")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
              </AppTable>
            )}
          </TabsContent>

          <TabsContent value="files" className="cdp-pane mt-0 space-y-4">
            <section className="cdp-sectors !m-0 space-y-4">
              <header className="cdp-sectors-head">
                <div>
                  <h3>{t("historicalImport.profileFiles")}</h3>
                  <p>
                    {creating || !selectedCustomer
                      ? t("historicalImport.addClient")
                      : t("historicalImport.forClient", { name: selectedCustomer.name })}
                  </p>
                </div>
              </header>
              <div className="grid gap-4 sm:grid-cols-2">
                <SheetFileCard
                  id="trades-file"
                  title={t("historicalImport.tradesFile")}
                  hint={t("historicalImport.tradesFileHint")}
                  file={tradesFile}
                  onFile={(file) => {
                    setTradesFile(file);
                    setTradesPreview(null);
                  }}
                />
                <SheetFileCard
                  id="cash-file"
                  title={t("historicalImport.cashFile")}
                  hint={t("historicalImport.cashFileHint")}
                  file={cashFile}
                  onFile={(file) => {
                    setCashFile(file);
                    setCashPreview(null);
                  }}
                />
              </div>
              {validateMut.isError ? (
                <p className="font-mono text-sm text-rose-500">{(validateMut.error as Error).message}</p>
              ) : null}
              <div className="cdp-actions">
                <Button className="cdp-ghost-action" variant="outline" onClick={() => setTab("clients")}>
                  {t("common.cancel")}
                </Button>
                <Button
                  className="cdp-add"
                  disabled={!filesReady || validateMut.isPending}
                  onClick={() => {
                    setTab("review");
                    validateMut.mutate();
                  }}
                >
                  {validateMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="me-2 h-4 w-4" />}
                  {t("historicalImport.nextReview")}
                </Button>
              </div>
              {!filesReady ? <p className="text-xs text-muted-foreground">{t("historicalImport.needBothFiles")}</p> : null}
            </section>
          </TabsContent>

          <TabsContent value="review" className="cdp-pane mt-0 space-y-4">
            <section className="cdp-sectors !m-0 space-y-4">
              <header className="cdp-sectors-head">
                <div>
                  <h3>{t("historicalImport.wizard.review")}</h3>
                  <p>{t("historicalImport.reviewHint")}</p>
                </div>
              </header>
              {validateMut.isPending || (filesReady && !tradesPreview && !cashPreview && !validateMut.isError) ? (
                <div className="grid place-items-center gap-3 rounded-[16px] border border-[#dfe6f6] bg-white/80 px-6 py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1a4cc4]" />
                  <p className="text-sm font-medium text-[#2b3d67]">{t("historicalImport.reviewLoading")}</p>
                  <p className="text-xs text-[#50669a]">{t("historicalImport.reviewLoadingHint")}</p>
                </div>
              ) : (
                <>
              <div className="space-y-2 text-start">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {t("historicalImport.identityFromSheet")}
                </p>
                <IdentityFacts identity={mergeIdentity(tradesPreview?.identity, cashPreview?.identity)} />
              </div>
              {profileFields}
              <SheetIssueList issues={[...(tradesPreview?.issues || []), ...(cashPreview?.issues || [])]} />
              {validateMut.isError ? (
                <p className="font-mono text-sm text-rose-500">{(validateMut.error as Error).message}</p>
              ) : null}
              {!reviewValid && !validateMut.isPending ? (
                <p className="text-sm text-rose-500">{t("historicalImport.invalidFiles")}</p>
              ) : null}

              <div className="grid items-stretch gap-4 xl:grid-cols-2">
                <SheetPreviewGrid
                  title={t("historicalImport.parsedTrades")}
                  fileName={tradesFile?.name}
                  grid={tradesPreview?.grid}
                  parsedCount={tradesPreview?.parsedCount ?? 0}
                  skippedCount={tradesPreview?.skippedCount ?? 0}
                  skippedBuySell={tradesPreview?.skippedBuySell}
                  kind="trades"
                />
                <SheetPreviewGrid
                  title={t("historicalImport.parsedCash")}
                  fileName={cashFile?.name}
                  grid={cashPreview?.grid}
                  parsedCount={cashPreview?.parsedCount ?? 0}
                  skippedCount={cashPreview?.skippedCount ?? 0}
                  skippedBuySell={cashPreview?.skippedBuySell}
                  kind="cash"
                />
              </div>

              {commitMut.isError ? (
                <p className="font-mono text-sm text-rose-500">{(commitMut.error as Error).message}</p>
              ) : null}
              <div className="cdp-actions">
                <Button className="cdp-ghost-action" variant="outline" onClick={() => setTab("files")}>
                  {t("historicalImport.backToFiles")}
                </Button>
                <Button className="cdp-ghost-action" variant="outline" disabled={!reviewValid} onClick={() => setTab("portfolio")}>
                  <Eye className="me-2 h-4 w-4" />
                  {t("historicalImport.viewPortfolio")}
                </Button>
              </div>
                </>
              )}
            </section>
          </TabsContent>

          <TabsContent value="portfolio" className="cdp-pane mt-0 space-y-4">
            <section className="cdp-sectors !m-0 space-y-4">
              <header className="cdp-header !mb-0">
                <div className="cdp-title">
                  <h1 className="!text-[22px]">{t("historicalImport.wizard.portfolio")}</h1>
                  <p>{needsFilePreview ? t("historicalImport.portfolioPreviewHint") : t("historicalImport.portfolioLiveHint")}</p>
                </div>
                <div className="cdp-header-actions">
                  <DatePicker
                    className="cdp-date"
                    prefix={t("historicalPortfolio.dateLabel")}
                    value={asOf}
                    onChange={(iso) => setAsOf(iso || today)}
                    max={today}
                  />
                </div>
              </header>
              {sheetPreviewError ? (
                <p className="font-mono text-sm text-rose-500">{(sheetPreviewError as Error).message}</p>
              ) : null}
              {holdingsModel || portfolioLoading ? (
                <ClientHoldingsStation
                  model={holdingsModel ?? emptyClientHoldingsViewModel()}
                  variant="full"
                  loading={portfolioLoading}
                  showSourceHints
                />
              ) : (
                <EmptyState
                  title={t("historicalImport.portfolioEmptyTitle")}
                  description={t("historicalImport.portfolioEmptyDesc")}
                />
              )}
              {commitMut.isError ? (
                <p className="font-mono text-sm text-rose-500">{(commitMut.error as Error).message}</p>
              ) : needsFilePreview && !resolvedImportName ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">{t("historicalImport.needClientName")}</p>
              ) : null}
              <div className="cdp-actions">
                <Button className="cdp-ghost-action" variant="outline" onClick={() => setTab(needsFilePreview ? "review" : "clients")}>
                  {needsFilePreview ? t("historicalImport.backToReview") : t("historicalImport.wizard.clients")}
                </Button>
                {needsFilePreview ? (
                  <Button className="cdp-add" disabled={!canCommit || commitMut.isPending} onClick={() => commitMut.mutate()}>
                    {commitMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Upload className="me-2 h-4 w-4" />}
                    {t("historicalImport.commitClientFiles")}
                  </Button>
                ) : customerId ? (
                  <Button size="sm" className="cdp-ghost-action" variant="outline" asChild>
                    <Link href={`/customers-old/${customerId}`}>{t("historicalImport.openAsOf")}</Link>
                  </Button>
                ) : null}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="market" className="cdp-pane mt-0 space-y-4">
            <section className="cdp-sectors !m-0 space-y-4">
              <header className="cdp-sectors-head">
                <div>
                  <h3>{t("historicalImport.wizard.market")}</h3>
                  <p>{t(`historicalImport.purposes.${marketKind}`)}</p>
                </div>
              </header>
              <div className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                {MARKET_KINDS.map((kind) => (
                  <Button
                    key={kind}
                    type="button"
                    variant={marketKind === kind ? "default" : "outline"}
                    className={marketKind === kind ? "cdp-add" : "cdp-ghost-action"}
                    onClick={() => {
                      setMarketKind(kind);
                      setMarketFile(null);
                      setMarketPreview(null);
                    }}
                  >
                    {t(`historicalImport.tabs.${kind}`)}
                  </Button>
                ))}
              </div>
              <Field label={t("historicalImport.typicalFileName")}>
                <p className="font-mono text-sm" dir="ltr">{marketSpec?.typicalFile || t(`historicalImport.refs.${marketKind}`)}</p>
              </Field>
              <Field label={t("historicalImport.workbook")}>
                <WorkbookPicker
                  id="market-file"
                  file={marketFile}
                  onFile={(next) => {
                    setMarketFile(next);
                    setMarketPreview(null);
                  }}
                />
              </Field>
              <label className="flex items-start gap-2 text-start text-sm">
                <input type="checkbox" className="mt-1" checked={replaceMarket} onChange={(e) => setReplaceMarket(e.target.checked)} />
                <span>{t("historicalImport.replacePrevious")} <span className="text-xs text-muted-foreground">{t("historicalImport.replaceHintMarket")}</span></span>
              </label>
              <div className="cdp-actions">
                <Button className="cdp-ghost-action" variant="outline" disabled={!marketFile || marketValidateMut.isPending} onClick={() => marketValidateMut.mutate()}>
                  {marketValidateMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="me-2 h-4 w-4" />}
                  {t("historicalImport.validateKeys")}
                </Button>
                <Button className="cdp-add" disabled={!marketFile || !marketPreview?.valid || marketCommitMut.isPending} onClick={() => marketCommitMut.mutate()}>
                  {marketCommitMut.isPending ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Upload className="me-2 h-4 w-4" />}
                  {t("historicalImport.commitDb")}
                </Button>
              </div>
              {marketPreview ? (
                <div className="space-y-3">
                  <SheetIssueList issues={marketPreview.issues || []} />
                  <SheetPreviewGrid
                    title={t(`historicalImport.tabs.${marketKind}`)}
                    fileName={marketFile?.name}
                    grid={marketPreview.grid}
                    parsedCount={marketPreview.parsedCount}
                    skippedCount={marketPreview.skippedCount}
                    kind="market"
                  />
                </div>
              ) : null}
            </section>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("historicalImport.deleteClient")}</AlertDialogTitle>
            <AlertDialogDescription>{t("historicalImport.deleteClientDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={deleteClientMut.isPending} onClick={() => deleteId && deleteClientMut.mutate()}>
              {deleteClientMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("historicalImport.deleteClient")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
