import type { AppLocale } from "@/i18n";

export type NavPageGuide = {
  summary: string;
  forWho: string;
  whatItDoes: string;
  whatYouGet: string[];
  howToUse: string[];
  moreSimple: string[];
  moreTechnical: string[];
};

/** Maps route href → guide id (stable key). */
export const NAV_GUIDE_ID_BY_HREF: Record<string, string> = {
  "/": "dashboard",
  "/customers": "clients2",
  "/customers-old": "clients",
  "/markets": "marketsOverview",
  "/screener": "screener",
  "/stocks": "stocks",
  "/fixed-income": "fixedIncome",
  "/indices": "indices",
  "/sectors": "sectors",
  "/research/approved-list": "approvedList",
  "/research/sharia-esg": "shariaEsg",
  "/research/strategies": "strategies",
  "/research/scoring": "scoring",
  "/builder": "builder",
  "/rebalances": "rebalances",
  "/simulator": "simulator",
  "/orders": "orders",
  "/data-import": "sheetImport",
  "/ai": "ai",
  "/commentary": "commentary",
  "/scenarios": "scenarios",
  "/frontier": "frontier",
  "/fees": "fees",
  "/ops-forms": "opsForms",
  "/reconciliation": "reconciliation",
  "/reports": "reports",
  "/statements": "statements",
  "/balances": "balances",
  "/live": "live",
  "/workshop": "workshop",
  "/uat": "uat",
  "/compliance": "compliance",
  "/risk": "risk",
  "/audit": "audit",
  "/users": "users",
  "/system-config": "systemConfig",
};

const EN: Record<string, NavPageGuide> = {
  dashboard: {
    summary:
      "Firm-wide command center: AUM, daily P&L, active portfolios, and shortcuts into markets, clients, and control.",
    forWho:
      "PMs, supervisors, and anyone who needs a morning snapshot of the book without opening every module.",
    whatItDoes:
      "Aggregates live portfolio metrics, AUM trajectory, sector signals, and top clients/stocks into one view.",
    whatYouGet: [
      "Total AUM, daily P&L, active portfolio count, average size",
      "AUM trajectory chart over time",
      "Sector alpha signals (enter / avoid)",
      "Key portfolios and latest market names",
    ],
    howToUse: [
      "Scan KPIs first — red/green daily P&L shows mark-to-market vs prior close",
      "Open Sectors from the sector card when you need the full signal pack",
      "Jump to Clients or Stocks from the table links",
    ],
    moreSimple: [
      "This is your morning overview of how the firm’s portfolios are doing.",
      "Big numbers show total value and today’s gain or loss.",
      "You can open clients, stocks, or sectors without searching the menu.",
      "If a section looks empty, data may not be loaded yet for those accounts.",
    ],
    moreTechnical: [
      "Numbers come from the backend dashboard and portfolio-manager APIs — the UI does not invent NAV",
      "Sector scores are analysis-only; they never approve trades",
      "Empty states appear until accounts have valued history or stocks are loaded",
    ],
  },
  clients: {
    summary:
      "Master list of managed investor accounts with mandate status, value, cash, and control flags.",
    forWho: "Portfolio managers, onboarding staff, and approvers who open a client cockpit.",
    whatItDoes: "Search/filter clients, create new accounts (with auto portfolio), and drill into each CDP.",
    whatYouGet: [
      "Totals: accounts, portfolio value, invested capital, average return",
      "Filters for risk, Shariah preference, mandate status, open breaches",
      "Columns for mandate, risk, cash, return, and pending rebalances",
    ],
    howToUse: [
      "Use search for name/email, then open a row to the client detail page",
      "Create Customer only if your role allows write actions",
      "Watch Controls / RB pending badges before proposing trades",
    ],
    moreSimple: [
      "This is the main list of investor accounts you manage.",
      "Each row is one account — open it to see the full client workspace.",
      "Check mandate status before you try to trade; unapproved means no trading.",
      "Badges warn you about open control issues or pending rebalances.",
    ],
    moreTechnical: [
      "A client can have multiple accounts — this list is account-centric",
      "Mandate must be Approved before trading is allowed on the detail page",
      "Deleting a client is gated and audited",
    ],
  },
  clients2: {
    summary: "Read-only clients and historical portfolio reconstructed from the external SQL transaction database.",
    forWho: "Portfolio managers reviewing Oracle-sourced cash and share ledgers without creating accounts in IPMS.",
    whatItDoes: "Lists accounts by ClientId/NIN, opens a date-based holdings view, and shows share and cash transactions.",
    whatYouGet: [
      "Account / NIN / Client code from SQL",
      "As-of holdings using Excel Table1 formulas",
      "Share and cash ledgers — no create or edit",
    ],
    howToUse: [
      "Open Clients 2, pick an account, set As of date",
      "Use Holdings for the reconstructed portfolio; Transactions and Cash for the source rows",
      "Use original Clients for KYC, mandates, and writes",
    ],
    moreSimple: [
      "This list comes from another system’s SQL database, not from creating clients here.",
      "You can view positions and cash as of a date. You cannot add trades.",
      "Client names come from Investors (English or Arabic by UI language).",
    ],
    moreTechnical: [
      "Reads Investors, CB_SEC_COMP, SECTORS, ShareTransactions, CashTransactions (not staging)",
      "BuySellFlag B/S; InvType SP is qty-only at zero cost",
      "Market prices from IPMS stock_prices last close ≤ as-of; else last trade Net÷Qty",
    ],
  },
  marketsOverview: {
    summary: "QSE market snapshot: breadth, movers, and index context for the session.",
    forWho: "Research and PMs checking market tone before construction or rebalance.",
    whatItDoes: "Shows advancers/decliners and top gainers/losers from available price history.",
    whatYouGet: ["Breadth counters", "Top gainers and losers tables", "Quick path into Screener / Stocks"],
    howToUse: ["Refresh after prices load", "Click a ticker if linked into stock detail"],
    moreSimple: [
      "A quick look at how Qatar Stock Exchange names moved today.",
      "See how many stocks rose versus fell, plus the biggest movers.",
      "Useful before you build or rebalance a portfolio.",
    ],
    moreTechnical: [
      "Needs at least two sessions of price history for movers",
      "Analysis surface — not an OMS",
    ],
  },
  screener: {
    summary: "Filter QSE equities by sector, Shariah, liquidity, and approval status.",
    forWho: "Research analysts building shortlists for models and approved lists.",
    whatItDoes: "Interactive screen over the stock universe with close and ADTV fields.",
    whatYouGet: ["Ticker / sector / Shariah / approved / close / ADTV columns", "Search and sector filters"],
    howToUse: ["Set filters, then open a name into company analysis or stock detail"],
    moreSimple: [
      "Search and filter listed stocks to build a shortlist.",
      "Narrow by sector, Shariah status, liquidity, or approval.",
      "Open any name for more detail — this screen does not place orders.",
    ],
    moreTechnical: [
      "Illiquid flags follow ADTV policy (Phase 1 warning unless hard-block config)",
      "Does not place orders",
    ],
  },
  stocks: {
    summary: "Stock master for QSE names: classification, liquidity, regulatory status, and price tools.",
    forWho: "Data ops, research, and PMs maintaining the tradable universe.",
    whatItDoes: "List, search, classify, and bulk-upload prices; open any ticker for history and corporate actions.",
    whatYouGet: ["Shariah / regulatory / illiquid flags", "Bulk upload & classification", "Links into Stock Detail"],
    howToUse: ["Filter classifications first", "Upload Excel via preview when correcting history"],
    moreSimple: [
      "The official stock register for names you can work with.",
      "Update classifications and upload price history when needed.",
      "Open a ticker to see prices, history, and corporate actions.",
    ],
    moreTechnical: [
      "Classification feeds mandate eligibility (binary Shariah in current engine)",
      "Price points drive NAV and builder",
    ],
  },
  fixedIncome: {
    summary: "Debt instruments (bonds / sukuk / T-bills) with coupon terms and lot-level daily P&L.",
    forWho: "PMs and ops tracking non-equity holdings inside managed portfolios.",
    whatItDoes: "Instrument register plus navigation into per-lot daily books.",
    whatYouGet: ["Ticker, coupon, maturity, frequency, par", "Terms complete / required status"],
    howToUse: ["Complete terms before expecting accurate accrual", "Open a lot for day-by-day book/MTM P&L"],
    moreSimple: [
      "Tracks bonds, sukuk, and T-bills held in portfolios.",
      "Complete coupon and maturity terms so daily P&L is reliable.",
      "Open a lot to see day-by-day book and market P&L.",
    ],
    moreTechnical: [
      "Coupon accrual uses actual calendar days in the period model",
      "Separate from equity holdings ledger",
    ],
  },
  indices: {
    summary: "Benchmark index series (QERI / DSM) used for mandates, performance, and builder reference.",
    forWho: "PMs setting benchmarks and data staff loading index levels.",
    whatItDoes: "Browse indices, upload levels, and manage constituents.",
    whatYouGet: ["Index list and search", "Upload with conflict preview", "Constituent management"],
    howToUse: ["Upload CI_DATE / CI_CURRENT_INDEX style sheets via preview", "Open an index for OHLC/history"],
    moreSimple: [
      "Benchmarks such as QERI and DSM that portfolios are compared against.",
      "Upload official index levels and review which stocks belong to each index.",
      "Used when measuring performance versus the market.",
    ],
    moreTechnical: [
      "Index membership can affect concentration exceptions",
      "Used in performance vs benchmark charts",
    ],
  },
  sectors: {
    summary: "AI-assisted sector intelligence: scores, recommendations, and news-driven themes.",
    forWho: "Research and PMs sizing sector exposure inside IPS limits.",
    whatItDoes: "Runs/displays sector scores and opens detail with articles and drivers.",
    whatYouGet: ["Score of 100 views", "Buy / Hold / Reduce style recommendations", "Pipeline status"],
    howToUse: ["Fetch news / run analysis when empty", "Open a sector for drivers and risks"],
    moreSimple: [
      "Research view of how sectors look, with scores and simple recommendations.",
      "Run or refresh analysis when the page is empty.",
      "Open a sector to read drivers, risks, and related news.",
      "These scores help thinking — they do not approve trades.",
    ],
    moreTechnical: [
      "Gemini/AI is analysis-only — never approves trades or fees",
      "Scores do not override compliance",
    ],
  },
  approvedList: {
    summary: "Governed buy/hold/sell-only/watch/restricted statuses per name.",
    forWho: "Investment / research maintaining tradable policy lists.",
    whatItDoes: "Set and review approved-list status that research and builder consumers can read.",
    whatYouGet: ["Status grid", "Set status actions"],
    howToUse: ["Pick a stock and set Approved Buy / Hold / Sell Only / Watchlist / Restricted"],
    moreSimple: [
      "A policy list that says what you may buy, hold, sell only, watch, or restrict.",
      "Pick a stock and set the status the investment team agreed on.",
      "It guides research and construction — it does not replace the mandate Shariah rules.",
    ],
    moreTechnical: [
      "Does not replace mandate Shariah universe",
      "Advisory governance — confirm with IC policy",
    ],
  },
  shariaEsg: {
    summary: "Shariah classification evidence and ESG review notes.",
    forWho: "Shariah reviewers and compliance-aware research.",
    whatItDoes: "Maintain classification evidence and ESG review records.",
    whatYouGet: ["Review entries", "Sync / unknown status cues"],
    howToUse: ["Add a review when classification changes", "Keep notes suitable for audit"],
    moreSimple: [
      "Where reviewers keep evidence for Shariah and ESG classifications.",
      "Add a review note whenever a classification changes.",
      "Write notes clearly — they may be checked in an audit.",
    ],
    moreTechnical: [
      "Live eligibility uses binary shariah | not_shariah in the engine",
      "Do not invent A/B/C groups unless product restores them",
    ],
  },
  strategies: {
    summary: "Model strategy notes with IC draft → submit → approve flow.",
    forWho: "Investment committee and strategy authors.",
    whatItDoes: "Capture strategy drafts and track IC approval state.",
    whatYouGet: ["Model codes (e.g. FS_MED)", "Draft / submit / approve actions"],
    howToUse: ["Create draft, submit to IC, approve when confirmed"],
    moreSimple: [
      "Write and track investment strategy models for committee review.",
      "Start as a draft, submit to the IC, then approve when confirmed.",
      "Strategies guide construction — they do not trade by themselves.",
    ],
    moreTechnical: ["Strategies inform model overlays — they do not auto-trade"],
  },
  scoring: {
    summary: "Advisory stock factor scores — waiting on confirmed factor model where noted.",
    forWho: "Research ranking names for idea generation.",
    whatItDoes: "Displays ranks/scores when a factor model is available.",
    whatYouGet: ["Rank and score table", "Empty state when model unconfirmed"],
    howToUse: ["Treat as advisory only until Investment confirms weights"],
    moreSimple: [
      "Ranks stocks by factor scores to help generate ideas.",
      "If the page is empty, the factor model may not be confirmed yet.",
      "Treat scores as advice until Investment confirms the weights.",
    ],
    moreTechnical: ["REQUIRES CONFIRMATION items must not be treated as production policy"],
  },
  builder: {
    summary: "Mandate-led portfolio construction: targets, sleeves, proposed trades, compliance review.",
    forWho: "PMs building proposals before convert to rebalance.",
    whatItDoes: "Select account + mandate constraints, set allocation/model, validate, then save/review.",
    whatYouGet: ["Proposed holdings and trades", "Validation & compliance panel", "Convert path into rebalances"],
    howToUse: [
      "Only Approved mandates can trade/propose",
      "Run review before convert",
      "Respect cash and Shariah universe checks",
    ],
    moreSimple: [
      "Build a proposed portfolio under the client’s mandate rules.",
      "Set targets, review proposed trades, then check compliance before you continue.",
      "Only approved mandates allow proposals.",
      "When ready, convert the proposal into a rebalance record.",
    ],
    moreTechnical: [
      "Medium risk uses core/satellite construction rules from IPS",
      "Compliance is permission; Risk is danger — both still apply after convert",
      "UI never owns eligibility — server engines do",
    ],
  },
  rebalances: {
    summary: "Register of proposals through draft → approved → executed → final lock.",
    forWho: "PMs, approvers, and ops tracking lifecycle of a rebalance.",
    whatItDoes: "Filter and open rebalance records created from builder or other flows.",
    whatYouGet: ["Status, trigger, client, reference", "Entry into Rebalance Detail"],
    howToUse: ["Filter by client/status/trigger", "Open a row to approve, execute, or final-lock"],
    moreSimple: [
      "The register of rebalance proposals and their status.",
      "Follow the path: draft → approved → executed → final.",
      "Open a row to approve, execute, or lock the record.",
      "Final records stay locked except through controlled corrections.",
    ],
    moreTechnical: [
      "Final records are not casually edited — corrections are controlled",
      "State machine is enforced server-side",
    ],
  },
  simulator: {
    summary: "Pre-trade what-if: cash, weights, sectors, compliance — no orders written.",
    forWho: "PMs testing an idea before Builder or OMS.",
    whatItDoes: "Simulates a BUY/SELL against a portfolio and returns impact + checks.",
    whatYouGet: ["Cash before/after, NAV after", "Weight impact table", "Compliance check list"],
    howToUse: ["Pick portfolio + stock + side + qty", "Optional limit price; empty uses last"],
    moreSimple: [
      "Try a buy or sell idea safely without placing a real order.",
      "See how cash, weights, and compliance would change.",
      "Useful before you open Builder or the order blotter.",
    ],
    moreTechnical: [
      "Safe sandbox — does not post trades",
      "Still reflects live mandate/IPS engines",
    ],
  },
  orders: {
    summary: "OMS drafts: draft → approve → send → fill, then post-trade compliance.",
    forWho: "Trading desk / PMs with order permissions.",
    whatItDoes: "Create draft orders and progress them through fill.",
    whatYouGet: ["Order blotter", "Approve / Send / Fill actions"],
    howToUse: ["Create draft with portfolio/stock/qty/broker", "Fill price posts trades when permitted"],
    moreSimple: [
      "Create and progress real trading orders.",
      "Typical path: draft → approve → send → fill.",
      "Filling an order posts the trade when your role allows it.",
    ],
    moreTechnical: [
      "Fills write trades and may run after-trade compliance",
      "Not every Phase 1 user will have this route",
    ],
  },
  sheetImport: {
    summary: "Super-admin workbook import: securities → prices → indices → client → trades → cash.",
    forWho: "Super admins reconstructing or seeding historical books.",
    whatItDoes: "Validate sheet keys then commit in the required order.",
    whatYouGet: ["File status, row counts, notes", "Commit batches and client targeting"],
    howToUse: ["Validate each file before commit", "Keep the documented order to avoid orphans"],
    moreSimple: [
      "Load historical workbooks in the correct order for a clean book.",
      "Validate each file before you commit.",
      "Only super admins can use this path.",
    ],
    moreTechnical: [
      "Restricted to super_admin username",
      "Does not replace Blueprint policy — it loads data",
    ],
  },
  ai: {
    summary: "Analysis-only AI drafts (summaries, commentary, research) under governance rules.",
    forWho: "PMs drafting narrative — never for silent approval.",
    whatItDoes: "Generate drafts from prompt types; accept/reject into a governance log.",
    whatYouGet: ["Prompt modes", "Draft preview", "Accept/reject log"],
    howToUse: ["Pick prompt type and optional portfolio", "Human must accept before treating as released content"],
    moreSimple: [
      "AI helps draft summaries and research notes — it does not decide for you.",
      "Generate a draft, then a person must accept or reject it.",
      "Never use AI output to approve trades, fees, or compliance.",
    ],
    moreTechnical: [
      "Forbidden to execute trades, approve fees, or override compliance",
      "D-006 / Blueprint §17 analysis-only",
    ],
  },
  commentary: {
    summary: "Generate → human accept/edit → release commentary packs.",
    forWho: "Reporting authors for client/AUM/IC narratives.",
    whatItDoes: "Draft commentary, accept/reject, mark released.",
    whatYouGet: ["Kind/period/status grid", "Body editor path", "Release gate"],
    howToUse: ["Generate AI draft, edit, accept, then mark released"],
    moreSimple: [
      "Write and release narrative packs for clients, AUM, or the IC.",
      "Generate or edit text, accept it, then mark it released.",
      "Do not release without a human accept step.",
    ],
    moreTechnical: ["Release without human accept violates the intended control"],
  },
  scenarios: {
    summary: "Stress/shock scenarios extending the trade simulator.",
    forWho: "Risk-aware PMs exploring shocks and liquidity stress.",
    whatItDoes: "Run named scenario kinds (price shock, cash deploy, etc.).",
    whatYouGet: ["Scenario results list", "Shock % inputs"],
    howToUse: ["Select portfolio and kind", "Interpret as advisory what-if"],
    moreSimple: [
      "Run what-if shocks such as price moves or cash deployment.",
      "Results are advisory — they help you think, not replace risk alerts.",
      "Pick a portfolio and scenario kind, then review the impact.",
    ],
    moreTechnical: ["Does not replace formal risk monitor alerts"],
  },
  frontier: {
    summary: "Efficient frontier advisory allocation — methodology may be unconfirmed.",
    forWho: "Research exploring weight proposals.",
    whatItDoes: "Runs an advisory allocation and lists proposed weights.",
    whatYouGet: ["Ticker / sector / proposed weight"],
    howToUse: ["Treat outputs as advisory until methodology is confirmed"],
    moreSimple: [
      "Suggests portfolio weights using an efficient-frontier style model.",
      "Treat results as research ideas until the methodology is confirmed.",
      "Always run compliance before treating weights as investable.",
    ],
    moreTechnical: ["Do not treat as IPS-compliant without compliance run"],
  },
  fees: {
    summary: "Rebate, management, and performance fee charges — cash posts only after approval.",
    forWho: "Ops and Investment reviewing fee runs (F-02 style gates).",
    whatItDoes: "Generate, filter, approve/reject fee charges.",
    whatYouGet: ["Pending/approved amounts", "Bulk approve/reject with audit reason"],
    howToUse: ["Generate for a period", "Select pending rows", "Approve/reject with reason"],
    moreSimple: [
      "Review management, performance, and related fee charges.",
      "Generate fees for a period, then approve or reject with a reason.",
      "Cash is not posted until approval — there is no silent auto-debit.",
    ],
    moreTechnical: [
      "Do not auto-debit without approval status model",
      "Bands live on the client mandate",
    ],
  },
  opsForms: {
    summary: "Ops workflow events F-01–F-06 (expiry, fees approval, renewal, etc.).",
    forWho: "Operations and control staff.",
    whatItDoes: "Create and track form events for governance checklists.",
    whatYouGet: ["Form code, status, created, actions"],
    howToUse: ["Create the relevant F-0x event and complete its status path"],
    moreSimple: [
      "Operational checklists coded F-01 through F-06.",
      "Create the form event you need and follow it to completion.",
      "Used for governance tracking such as expiry, fee approval, and renewal.",
    ],
    moreTechnical: ["Phase 2 governance surface — does not silently replace contract fee rules"],
  },
  reconciliation: {
    summary: "Reconciliation runs that gate report release.",
    forWho: "Ops before publishing client/AUM/IC packs.",
    whatItDoes: "Record recon as-of status and holdings flags.",
    whatYouGet: ["Run list", "Status and flags"],
    howToUse: ["Run recon before creating report packs"],
    moreSimple: [
      "Confirm books and holdings match before you publish reports.",
      "Run reconciliation and check status flags.",
      "When policy requires it, wait for a clean recon before report packs.",
    ],
    moreTechnical: ["Reports should wait on a clean recon when policy requires it"],
  },
  reports: {
    summary: "Client / AUM / IC report packs with print-friendly payloads.",
    forWho: "Reporting and relationship teams.",
    whatItDoes: "Create packs by kind/period and print via browser dialog.",
    whatYouGet: ["Pack list", "Summary AUM / holdings sample", "Print action"],
    howToUse: ["Create pack after recon when required", "Allow pop-ups for print"],
    moreSimple: [
      "Create client, AUM, or IC report packs for a chosen period.",
      "Print through the browser print dialog.",
      "Allow pop-ups if printing does not open.",
    ],
    moreTechnical: ["Print uses browser print — not a separate OMS ticket"],
  },
  statements: {
    summary: "Trading-system client statements from the SQL ledger: portfolio, account, realized P&L summary and details.",
    forWho: "PMs and ops printing as-of / period statements for any SQL investor.",
    whatItDoes: "Loads server-built statement JSON and previews tables. Does not recalculate money in the browser.",
    whatYouGet: [
      "Four statement kinds matching the current trading PDFs",
      "As-of date or from/to according to the kind",
      "Screen preview plus a temporary print window (layout match is the next step)",
    ],
    howToUse: [
      "Pick a client, statement type, and dates, then Generate",
      "Or open Statements from a client detail page with the current as-of date",
      "Blank footer cells mean the formula is not confirmed yet — they are not zero",
    ],
    moreSimple: [
      "Print client statements like the current trading system.",
      "Choose the investor and dates; the server sends the numbers.",
      "This is not the locked monthly AUM/IC reports page.",
    ],
    moreTechnical: [
      "GET /api/ext/clients/:id/statements/… — read-only SQL",
      "Official close only on portfolio statements; last-trade fallback is forbidden",
      "/reports stays locked (Blueprint AUM/IC packs)",
    ],
  },
  balances: {
    summary: "Daily match of QSC ClientPortfolioSnapshot vs IPMS reconstruction from the SQL blotter and official closes.",
    forWho: "Accountant and ops checking Portfolio Value and System Cash against IPMS.",
    whatItDoes: "Reads QSC’s 15:00 SQL snapshot (read-only) and stores a Cloudilic compare row in Postgres. Does not write to SQL.",
    whatYouGet: [
      "QSC PortfolioValue vs IPMS equity MV and vs MV+cash (definition unsigned)",
      "QSC SystemCash vs IPMS cash ledger",
      "Bank shown from QSC only — IPMS bank source is unknown",
    ],
    howToUse: [
      "Pick a QSC snapshot date chip (SQL, read-only) or type as-of, then Run compare if that day is not stored in IPMS yet",
      "Matched means an invested book: cash matches and PortfolioValue equals MV or MV+cash within 0.01 QAR. Cash-only means no equity (MV = 0) — not a PortfolioValue sign-off",
    ],
    moreSimple: [
      "See whether QSC balances match this system the same day.",
      "Green match is not a NAV sign-off — two portfolio-value columns stay visible.",
      "Not the locked OMS reconciliation page.",
    ],
    moreTechnical: [
      "GET/POST /api/snapshots — Postgres ipms_client_snapshots",
      "SQL ClientPortfolioSnapshot read-only; key is ClientId = Investors.CL_CLIENT_ID",
      "Official close only; last-trade fallback forbidden",
    ],
  },
  live: {
    summary: "Waiting room for the QSC session broadcast. Does not connect until URL and JSON samples exist.",
    forWho: "PMs watching session prices. Not for historical statements.",
    whatItDoes: "Shows whether the feed is configured. Never writes official closes from live ticks.",
    whatYouGet: [
      "Status: not connected until questions 23–25 are answered",
      "The five object names QSC listed (watch, trades, depth, indices, summary)",
    ],
    howToUse: [
      "Leave this page until QSC sends the hub URL, auth, and five JSON samples",
      "Do not treat a live last price as a statement close",
    ],
    moreSimple: [
      "This is the live tape, not the end-of-day statement.",
      "Nothing is streaming yet.",
    ],
    moreTechnical: [
      "GET /api/live/status — no WebSocket client until samples",
      "BROADCAST_WS_URL in env; still will not connect without JSON samples (D-016)",
      "Must not write stock_prices from this feed unless QSC signs question 25",
    ],
  },
  workshop: {
    summary: "Waiting room for open product decisions. Displays what code does today. Does not sign off a BD.",
    forWho: "PMs, compliance, and anyone preparing the QSC workshop. Not an Investment sign-off screen.",
    whatItDoes: "Lists BD-001…011 and handover questions 16, 18, 19, 27–31 with current implementation facts.",
    whatYouGet: [
      "Ask text for the client",
      "Code-today facts from the decision register",
      "Status stays blocked until a named owner signs a D-* row",
    ],
    howToUse: [
      "Send the listed questions; do not pick an option in the UI",
      "Do not restore Shariah A/B/C, invent holidays, or unlock OMS from this page",
    ],
    moreSimple: [
      "These are product questions the client still has to answer.",
      "The table shows what the system does today — that is not the signed policy.",
    ],
    moreTechnical: [
      "GET /api/product-decisions — signed is always false",
      "No POST. Engines, schema, and 0008 are unchanged",
    ],
  },
  uat: {
    summary: "Waiting room for Phase 1 acceptance. Does not run 09-ACCEPTANCE or unlock later-phase routes.",
    forWho: "PMs and supervisors. Not a sign-off that Phase 1 is complete.",
    whatItDoes: "Lists why UAT cannot start: missing closes, unsigned footers, Shariah conflict, no named owner.",
    whatYouGet: [
      "runnable stays false",
      "Reminder that 10-GAP-ANALYSIS is not live status",
      "OMS / fees / Next.js stay locked",
    ],
    howToUse: [
      "Do not tick 09 from this page",
      "Wait for official closes after 2026-08-19 and QSC sign-off",
    ],
    moreSimple: [
      "Phase 1 is not finished just because screens exist.",
      "This page explains what is still blocked.",
    ],
    moreTechnical: [
      "GET /api/uat/status — runnable and phase1Accepted are always false",
      "Do not treat 10-GAP-ANALYSIS.md as current status",
    ],
  },
  compliance: {
    summary: "Permission tests: pre-proposal, pre-trade, post-trade vs mandate and IPS.",
    forWho: "Compliance officers and PMs clearing breaches.",
    whatItDoes: "Run checks, review results, request/decide exceptions.",
    whatYouGet: ["Pass/fail results", "Exception requests", "Audit-backed decisions"],
    howToUse: ["Select portfolio", "Run checks", "Request exception with reason and validity"],
    moreSimple: [
      "Checks whether a portfolio is allowed to do what you proposed under the mandate and IPS.",
      "Run checks, review pass/fail, and request an exception if needed.",
      "Compliance is about permission — Risk is a separate danger monitor.",
    ],
    moreTechnical: [
      "Compliance ≠ Risk — keep them separate",
      "Exceptions write to the audit trail",
    ],
  },
  risk: {
    summary: "Danger monitor: concentration, drawdown, liquidity, regulatory alerts.",
    forWho: "Risk owners and PMs remediating open alerts.",
    whatItDoes: "Scan portfolios, assign, resolve, or waive alerts with reasons.",
    whatYouGet: ["Open/resolved/waived queues", "Due dates and owners", "Scan all / scan one"],
    howToUse: ["Scan now", "Assign to me", "Resolve or waive with audit reason"],
    moreSimple: [
      "Watches for dangerous situations such as concentration, losses, or low liquidity.",
      "Scan portfolios, assign alerts, then resolve or waive with a reason.",
      "This is the danger screen — separate from the compliance permission checks.",
    ],
    moreTechnical: [
      "IPS thresholds (e.g. 15%/20% stock, sector 35%/40%) drive many alerts",
      "Idempotent scans should not spam duplicates",
    ],
  },
  audit: {
    summary: "Immutable evidence log for sensitive creates/updates/approvals/overrides.",
    forWho: "Compliance, audit, and supervisors reconstructing decisions.",
    whatItDoes: "Filter chronological events by action and object.",
    whatYouGet: ["Occurred / user / action / object / reason"],
    howToUse: ["Narrow by action type or object", "Export mentally into investigation notes"],
    moreSimple: [
      "A permanent log of who did what on sensitive actions.",
      "Filter by action type or object when investigating.",
      "History rows are not meant to be edited.",
    ],
    moreTechnical: [
      "Reasons are required on many mutating paths",
      "Do not expect editable history rows",
    ],
  },
  users: {
    summary: "Staff admin accounts (roles map to API requireRole gates).",
    forWho: "Admins only.",
    whatItDoes: "Create/edit/disable staff users and reset passwords.",
    whatYouGet: ["Username, display name, role, status"],
    howToUse: ["Create user with role", "Edit to set a new password (min length enforced)"],
    moreSimple: [
      "Manage staff logins and roles for the system.",
      "Create users, edit details, disable accounts, or reset passwords.",
      "You cannot delete your own login.",
    ],
    moreTechnical: [
      "Cannot delete your own login",
      "Role changes affect route access immediately",
    ],
  },
  systemConfig: {
    summary: "Super-admin IPS thresholds, feature flags, Halal stock tools, and official closes.",
    forWho: "Super admins only.",
    whatItDoes: "Edit config keys, Halal tags, and official closing prices used by statements.",
    whatYouGet: ["IPS rules tab", "Flags tab", "Halal stocks tab", "Official closes tab"],
    howToUse: ["Change a value and Save", "On Official closes: load KB CB_PRICES or add ticker+date+close"],
    moreSimple: [
      "Firm-wide settings for IPS limits, feature flags, and Halal helpers.",
      "Change a value carefully, then Save.",
      "Wrong IPS numbers can affect compliance and risk across every portfolio.",
    ],
    moreTechnical: [
      "Mis-setting IPS numbers affects compliance/risk firm-wide",
      "Keep changes auditable and intentional",
    ],
  },
};

const AR: Record<string, NavPageGuide> = {
  dashboard: {
    summary:
      "مركز القيادة على مستوى الشركة: الأصول المدارة، الربح والخسارة اليومي، المحافظ النشطة، مع اختصارات إلى الأسواق والعملاء والرقابة والحوكمة.",
    forWho:
      "مديرو المحافظ والمشرفون، وأي شخص يحتاج لمحة صباحية عن الدفتر دون فتح كل وحدة على حدة.",
    whatItDoes:
      "تجمع مقاييس المحافظ الحية ومسار الأصول المدارة وإشارات القطاعات وأبرز العملاء والأسهم في شاشة واحدة.",
    whatYouGet: [
      "إجمالي الأصول المدارة، الربح/الخسارة اليومي، عدد المحافظ النشطة، ومتوسط الحجم",
      "مخطط مسار الأصول المدارة عبر الزمن",
      "إشارات ألفا القطاعات (دخول / تجنّب)",
      "المحافظ الرئيسية وأحدث أسماء السوق",
    ],
    howToUse: [
      "ابدأ بمؤشرات الأداء؛ اللون يوضح التغيّر مقابل إغلاق الجلسة السابقة",
      "من بطاقة القطاعات انتقل إلى شاشة القطاعات كاملة عند الحاجة",
      "استخدم روابط الجداول للانتقال مباشرة إلى العملاء أو الأسهم",
    ],
    moreSimple: [
      "هذه شاشتك الصباحية لمعرفة وضع محافظ الشركة بسرعة.",
      "الأرقام الكبيرة تعرض إجمالي القيمة وما ربحته أو خسرته اليوم.",
      "يمكنك فتح العملاء أو الأسهم أو القطاعات مباشرة من هنا دون البحث في القائمة.",
      "إذا ظهر قسم فارغاً، فقد لا تكون البيانات محمّلة بعد لهذه الحسابات.",
    ],
    moreTechnical: [
      "الأرقام تأتي من واجهات مركز القيادة ومدير المحافظ في الخادم؛ الواجهة لا تحسب صافي قيمة الأصول بنفسها",
      "درجات القطاعات تحليلية فقط ولا تعتمد صفقات",
      "الحالات الفارغة تظهر حتى يتوفر تاريخ مُقيَّم للحسابات أو تُحمَّل بيانات الأسهم",
    ],
  },
  clients: {
    summary:
      "القائمة الرئيسية لحسابات المستثمرين المُدارة، مع حالة التفويض والقيمة والنقد وأعلام الرقابة.",
    forWho: "مديرو المحافظ وفرق الإدخال والمعتمدون الذين يفتحون مساحة عمل العميل.",
    whatItDoes:
      "تتيح البحث والتصفية وإنشاء حسابات جديدة (مع محفظة تلقائية) ثم الدخول إلى تفاصيل كل عميل.",
    whatYouGet: [
      "إجماليات الحسابات وقيمة المحفظة ورأس المال المستثمر ومتوسط العائد",
      "فلاتر للمخاطر وتفضيل الشريعة وحالة التفويض والمخالفات المفتوحة",
      "أعمدة للتفويض والمخاطر والنقد والعائد وإعادة التوازن قيد الانتظار",
    ],
    howToUse: [
      "ابحث بالاسم أو البريد ثم افتح الصف للانتقال إلى صفحة العميل",
      "أنشئ عميلاً جديداً فقط إذا كانت صلاحياتك تسمح بالكتابة",
      "راقب شارات الرقابة وإعادة التوازن قبل اقتراح أي صفقات",
    ],
    moreSimple: [
      "هذه قائمة حسابات المستثمرين التي تديرها الشركة.",
      "كل صف يمثل حساباً؛ افتحه لرؤية مساحة عمل العميل كاملة.",
      "تأكد من أن التفويض معتمد قبل محاولة التداول؛ بدون اعتماد لا يُسمح بالتداول.",
      "الشارات تنبّهك إلى مشاكل رقابية مفتوحة أو عمليات إعادة توازن قيد الانتظار.",
    ],
    moreTechnical: [
      "قد يكون للعميل أكثر من حساب؛ هذه القائمة مرتبة على مستوى الحساب",
      "يجب أن يكون التفويض معتمداً قبل السماح بالتداول من صفحة التفاصيل",
      "حذف العميل محكوم بصلاحيات ومُسجَّل في سجل التدقيق",
    ],
  },
  clients2: {
    summary: "عملاء وعرض محفظة تاريخية للقراءة فقط من قاعدة SQL الخارجية.",
    forWho: "مديرو المحافظ الذين يراجعون دفاتر النقد والأسهم القادمة من النظام الآخر دون إنشاء حسابات في IPMS.",
    whatItDoes: "تعرض الحسابات حسب رقم الحساب وNIN، وتفتح المحفظة حتى تاريخ، ودفاتر الأسهم والنقد.",
    whatYouGet: [
      "رقم الحساب / NIN / كود العميل من SQL",
      "حيازات حتى تاريخ بمعادلات جدول الإكسل",
      "دفاتر الأسهم والنقد — بدون إنشاء أو تعديل",
    ],
    howToUse: [
      "افتح العملاء 2، اختر حساباً، حدّد التاريخ",
      "الحيازات للمحفظة المعاد بناؤها؛ الصفقات والنقد لصفوف المصدر",
      "استخدم شاشة العملاء الأصلية لبيانات KYC والتفويض والكتابة",
    ],
    moreSimple: [
      "هذه القائمة تأتي من قاعدة النظام الآخر، وليست من إنشاء عملاء هنا.",
      "يمكنك مشاهدة المراكز والنقد حتى تاريخ. لا يمكنك إضافة صفقات.",
      "أسماء العملاء من جدول Investors (إنجليزي أو عربي حسب لغة الواجهة).",
    ],
    moreTechnical: [
      "يقرأ Investors وCB_SEC_COMP وSECTORS وShareTransactions وCashTransactions (وليس Staging)",
      "BuySellFlag B/S؛ InvType SP كمية فقط بتكلفة صفر",
      "سعر السوق من آخر إغلاق ≤ التاريخ في IPMS، وإلا آخر صفقة Net÷Qty",
    ],
  },
  marketsOverview: {
    summary: "نظرة السوق على بورصة قطر: اتساع السوق والمتحركين وسياق المؤشرات المرجعية في الجلسة.",
    forWho: "فرق البحوث ومديرو المحافظ الذين يراجعون مزاج السوق قبل بناء المحافظ أو إعادة التوازن.",
    whatItDoes: "تعرض الصاعدين والهابطين وأبرز الرابحين والخاسرين اعتماداً على تاريخ الأسعار المتاح.",
    whatYouGet: ["عدادات اتساع السوق", "جداول أبرز الرابحين والخاسرين", "مسار سريع إلى مصفّي الأسهم أو الأسهم"],
    howToUse: ["حدّث الصفحة بعد تحميل الأسعار", "افتح رمز السهم إن وُجد رابط لصفحة التفاصيل"],
    moreSimple: [
      "نظرة سريعة على حركة أسهم بورصة قطر اليوم.",
      "تعرف كم سهماً ارتفع وكم انخفض، وأين كانت أقوى التحركات.",
      "مفيدة قبل بناء محفظة أو تنفيذ إعادة توازن.",
    ],
    moreTechnical: [
      "حساب المتحركين يحتاج جلستي أسعار على الأقل",
      "سطح تحليلي فقط وليس نظام أوامر (OMS)",
    ],
  },
  screener: {
    summary: "مصفّي الأسهم لتصفية أسهم بورصة قطر حسب القطاع والشريعة والسيولة وحالة الاعتماد.",
    forWho: "محللو البحوث الذين يبنون قوائم قصيرة للنماذج والقوائم المعتمدة.",
    whatItDoes: "شاشة تفاعلية على كون الأسهم مع حقول الإغلاق ومتوسط التداول اليومي (ADTV).",
    whatYouGet: [
      "أعمدة الرمز والقطاع والشريعة والاعتماد والإغلاق وADTV",
      "بحث وفلاتر حسب القطاع",
    ],
    howToUse: ["اضبط الفلاتر ثم افتح أي اسم للتحليل أو تفاصيل السهم"],
    moreSimple: [
      "ابحث وصفِّ الأسهم المدرجة لبناء قائمة قصيرة.",
      "ضيّق النتائج حسب القطاع أو التوافق مع الشريعة أو السيولة أو الاعتماد.",
      "افتح أي سهم للمزيد من التفاصيل؛ هذه الشاشة لا تنشئ أوامر تداول.",
    ],
    moreTechnical: [
      "أعلام ضعيف السيولة تتبع سياسة ADTV (في المرحلة الأولى تنبيه ما لم يُفعَّل الحظر الصارم)",
      "لا تنشئ أوامر تداول",
    ],
  },
  stocks: {
    summary: "دليل أسهم بورصة قطر: التصنيف والسيولة والحالة التنظيمية وأدوات الأسعار.",
    forWho: "عمليات البيانات والبحوث ومديرو المحافظ الذين يصونون الكون القابل للتداول.",
    whatItDoes:
      "تعرض الأسهم وتبحث وتصنّف وترفع الأسعار بالجملة، مع فتح أي رمز لرؤية التاريخ وإجراءات الشركات.",
    whatYouGet: ["أعلام التوافق مع الشريعة والتنظيم وضعيف السيولة", "رفع وتصنيف بالجملة", "روابط إلى تفاصيل السهم"],
    howToUse: ["ابدأ بتصفية التصنيفات", "ارفع ملف Excel عبر المعاينة عند تصحيح التاريخ السعري"],
    moreSimple: [
      "السجل الرسمي للأسهم التي تعمل عليها المنصة.",
      "حدّث التصنيفات وارفع تاريخ الأسعار عند الحاجة.",
      "افتح أي رمز لمشاهدة الأسعار والتاريخ وإجراءات الشركات.",
    ],
    moreTechnical: [
      "التصنيف يغذي أهلية التفويض (تصنيف ثنائي متوافق / غير متوافق مع الشريعة في المحرك الحالي)",
      "نقاط السعر تحرّك حساب صافي قيمة الأصول ومنشئ المحفظة",
    ],
  },
  fixedIncome: {
    summary: "أدوات الدخل الثابت (سندات / صكوك / أذون خزانة) مع شروط الكوبون وربح وخسارة يومي على مستوى القطعة.",
    forWho: "مديرو المحافظ وفرق العمليات الذين يتابعون الحيازات غير الأسهم داخل المحافظ المُدارة.",
    whatItDoes: "سجل للأدوات مع الانتقال إلى الدفاتر اليومية لكل قطعة.",
    whatYouGet: ["الرمز والكوبون والاستحقاق والتكرار والقيمة الاسمية", "حالة اكتمال الشروط أو نقصها"],
    howToUse: ["أكمل الشروط قبل الاعتماد على استحقاق دقيق", "افتح القطعة لعرض ربح الدفتر والسوق يوماً بيوم"],
    moreSimple: [
      "متابعة السندات والصكوك وأذون الخزانة داخل المحافظ.",
      "أكمل شروط الكوبون والاستحقاق حتى يكون الربح اليومي موثوقاً.",
      "افتح أي قطعة لمشاهدة الربح والخسارة يوماً بيوم.",
    ],
    moreTechnical: [
      "استحقاق الكوبون يعتمد الأيام الفعلية في نموذج الفترة",
      "منفصل عن دفتر حيازات الأسهم",
    ],
  },
  indices: {
    summary: "سلاسل المؤشرات المرجعية (QERI / DSM) المستخدمة في التفويض وقياس الأداء ومرجع منشئ المحفظة.",
    forWho: "مديرو المحافظ الذين يضبطون المعيار، وفرق البيانات التي تحمّل مستويات المؤشر.",
    whatItDoes: "تصفح المؤشرات المرجعية ورفع المستويات وإدارة المكوّنات.",
    whatYouGet: ["قائمة المؤشرات مع البحث", "رفع مع معاينة التعارضات", "إدارة المكوّنات"],
    howToUse: [
      "ارفع ملفات المستويات بأسلوب CI_DATE / CI_CURRENT_INDEX عبر المعاينة",
      "افتح مؤشراً لعرض التاريخ والأسعار",
    ],
    moreSimple: [
      "معايير مثل QERI وDSM تُقارن بها أداء المحافظ.",
      "ارفع المستويات الرسمية وراجع الأسهم الداخلة في كل مؤشر.",
      "تُستخدم عند قياس الأداء مقابل السوق.",
    ],
    moreTechnical: [
      "عضوية المؤشر قد تؤثر على استثناءات التركيز",
      "تُستخدم في مخططات الأداء مقابل المعيار",
    ],
  },
  sectors: {
    summary: "ذكاء قطاعي بمساعدة الذكاء الاصطناعي: درجات وتوصيات ومواضيع مستمدة من الأخبار.",
    forWho: "البحوث ومديرو المحافظ الذين يضبطون انكشاف القطاعات ضمن حدود IPS.",
    whatItDoes: "تعرض درجات القطاعات وتفتح التفاصيل مع المقالات ومحركات التوصية.",
    whatYouGet: ["درجات من أصل 100", "توصيات بأسلوب شراء / احتفاظ / تخفيض", "حالة خط التحليل"],
    howToUse: ["اجلب الأخبار أو شغّل التحليل عند فراغ الصفحة", "افتح قطاعاً لقراءة المحركات والمخاطر"],
    moreSimple: [
      "عرض بحثي لوضع القطاعات مع درجات وتوصيات مبسّطة.",
      "شغّل التحليل أو حدّثه إذا كانت الصفحة فارغة.",
      "افتح أي قطاع لقراءة المحركات والمخاطر والأخبار المرتبطة.",
      "الدرجات تساعد على التفكير ولا تعتمد صفقات.",
    ],
    moreTechnical: [
      "الذكاء الاصطناعي (Gemini) تحليلي فقط — لا يعتمد صفقات ولا رسومًا أو عمولات",
      "الدرجات لا تتجاوز قواعد الامتثال",
    ],
  },
  approvedList: {
    summary: "حالات حوكمة لكل اسم: شراء معتمد / احتفاظ / بيع فقط / مراقبة / مقيّد.",
    forWho: "الاستثمار والبحوث الذين يصونون قوائم السياسة القابلة للتداول.",
    whatItDoes: "تعيين ومراجعة حالة القائمة المعتمدة التي تقرأها البحوث ومنشئ المحفظة.",
    whatYouGet: ["شبكة الحالات", "إجراءات تعيين الحالة"],
    howToUse: ["اختر سهماً وعيّن: شراء معتمد / احتفاظ / بيع فقط / قائمة مراقبة / مقيّد"],
    moreSimple: [
      "قائمة سياسة توضّح ما يُسمح بشرائه أو الاحتفاظ به أو البيع فقط أو المراقبة أو التقييد.",
      "اختر السهم وعيّن الحالة المتفق عليها مع فريق الاستثمار.",
      "توجّه البحوث وبناء المحافظ؛ ولا تستبدل قواعد التوافق مع الشريعة في التفويض.",
    ],
    moreTechnical: [
      "لا تستبدل كون الشريعة الخاص بالتفويض",
      "حوكمة استشارية — أكّدها مع سياسة لجنة الاستثمار",
    ],
  },
  shariaEsg: {
    summary: "أدلة التصنيف المتوافق مع الشريعة وملاحظات مراجعة الحوكمة البيئية والاجتماعية (ESG).",
    forWho: "مراجعو الشريعة والبحوث المرتبطة بالامتثال.",
    whatItDoes: "حفظ أدلة التصنيف وسجلات مراجعة ESG.",
    whatYouGet: ["سجلات المراجعة", "إشارات المزامنة أو الحالة غير المعروفة"],
    howToUse: ["أضف مراجعة عند تغيّر التصنيف", "اكتب ملاحظات واضحة وصالحة لسجل التدقيق"],
    moreSimple: [
      "مكان يحفظ فيه المراجعون أدلة التصنيف الشرعي وملاحظات ESG.",
      "أضف مراجعة كلما تغيّر التصنيف.",
      "اكتب بوضوح؛ فقد تُراجع الملاحظات في سجل التدقيق.",
    ],
    moreTechnical: [
      "الأهلية الحية ثنائية في المحرك: متوافق مع الشريعة | غير متوافق مع الشريعة",
      "لا تخترع مجموعات أ/ب/ج ما لم يُعد المنتج تفعيلها بقرار صريح",
    ],
  },
  strategies: {
    summary: "ملاحظات استراتيجيات النماذج مع مسار مسودة → إرسال → اعتماد لجنة الاستثمار.",
    forWho: "لجنة الاستثمار ومؤلفو الاستراتيجيات.",
    whatItDoes: "التقاط مسودات الاستراتيجيات وتتبع حالة اعتماد اللجنة.",
    whatYouGet: ["رموز النماذج (مثل FS_MED)", "إجراءات المسودة والإرسال والاعتماد"],
    howToUse: ["أنشئ مسودة ثم أرسلها للجنة ثم اعتمدها عند التأكيد"],
    moreSimple: [
      "اكتب وتتبع نماذج الاستراتيجيات الاستثمارية لمراجعة اللجنة.",
      "ابدأ بمسودة، أرسلها للجنة، ثم اعتمدها بعد التأكيد.",
      "الاستراتيجيات توجّه بناء المحافظ ولا تتداول تلقائياً.",
    ],
    moreTechnical: ["تغذي طبقات النماذج ولا تنفّذ تداولاً تلقائياً"],
  },
  scoring: {
    summary: "درجات عوامل استشارية للأسهم — قد تنتظر نموذجاً عاملياً مؤكداً حيث يُشار لذلك.",
    forWho: "البحوث لترتيب الأسماء وتوليد الأفكار.",
    whatItDoes: "تعرض الترتيب والدرجات عند توفر نموذج العوامل.",
    whatYouGet: ["جدول الترتيب والدرجة", "حالة فارغة عندما يكون النموذج غير مؤكد"],
    howToUse: ["اعتبر النتائج استشارية حتى يؤكد الاستثمار الأوزان"],
    moreSimple: [
      "ترتّب الأسهم حسب درجات العوامل للمساعدة في توليد الأفكار.",
      "إذا كانت الصفحة فارغة فقد يكون نموذج العوامل غير مؤكد بعد.",
      "عامل الدرجات كنصيحة حتى يؤكد الاستثمار الأوزان.",
    ],
    moreTechnical: ["ما يُعلَّم بأنه يتطلب تأكيداً لا يُعامل كسياسة إنتاج"],
  },
  builder: {
    summary: "منشئ المحفظة المحكوم بالتفويض: أهداف وشرائح وصفقات مقترحة ومراجعة امتثال.",
    forWho: "مديرو المحافظ الذين يجهّزون مقترحاً قبل تحويله إلى إعادة توازن.",
    whatItDoes:
      "اختيار الحساب وقيود التفويض وضبط التخصيص أو النموذج ثم التحقق والحفظ والمراجعة.",
    whatYouGet: ["حيازات وصفقات مقترحة", "لوحة التحقق والامتثال", "مسار التحويل إلى إعادة التوازن"],
    howToUse: [
      "التداول والاقتراح فقط على تفويض معتمد",
      "شغّل المراجعة قبل التحويل",
      "احترم فحوصات النقد وكون التوافق مع الشريعة",
    ],
    moreSimple: [
      "ابنِ مقترح محفظة وفق قواعد تفويض العميل.",
      "اضبط الأهداف وراجع الصفقات المقترحة ثم افحص الامتثال قبل المتابعة.",
      "التفويض المعتمد فقط يسمح بالاقتراح.",
      "عند الجاهزية حوّل المقترح إلى سجل إعادة توازن.",
    ],
    moreTechnical: [
      "المخاطر المتوسطة تتبع قواعد النواة/الساتلايت في IPS",
      "الامتثال إذن والمخاطر خطر — وكلاهما يبقى سارياً بعد التحويل",
      "محركات الخادم تملك قواعد الأهلية؛ الواجهة لا تملكها",
    ],
  },
  rebalances: {
    summary: "سجل مقترحات إعادة التوازن عبر المسار: مسودة → معتمد → منفَّذ → قفل نهائي.",
    forWho: "مديرو المحافظ والمعتمدون وفرق العمليات الذين يتابعون دورة حياة إعادة التوازن.",
    whatItDoes: "تصفية وفتح سجلات إعادة التوازن القادمة من منشئ المحفظة أو مسارات أخرى.",
    whatYouGet: ["الحالة والمحفّز والعميل والمرجع", "الدخول إلى تفاصيل إعادة التوازن"],
    howToUse: ["صفِّ حسب العميل أو الحالة أو المحفّز", "افتح صفاً للاعتماد أو التنفيذ أو القفل النهائي"],
    moreSimple: [
      "سجل مقترحات إعادة التوازن وحالاتها.",
      "المسار: مسودة ثم اعتماد ثم تنفيذ ثم قفل نهائي.",
      "افتح أي صف للاعتماد أو التنفيذ أو القفل.",
      "السجلات النهائية تبقى مقفلة إلا عبر تصحيحات محكومة.",
    ],
    moreTechnical: [
      "السجلات النهائية لا تُعدَّل بشكل عابر؛ التصحيحات محكومة",
      "آلة الحالة تُفرض على الخادم",
    ],
  },
  simulator: {
    summary: "محاكي التداول ماذا-لو قبل الصفقة: النقد والأوزان والقطاعات والامتثال — دون كتابة أوامر.",
    forWho: "مديرو المحافظ الذين يختبرون فكرة قبل منشئ المحفظة أو OMS.",
    whatItDoes: "يحاكي شراء أو بيع على محفظة ويعيد الأثر والفحوصات.",
    whatYouGet: ["النقد قبل/بعد وصافي قيمة الأصول بعد", "جدول أثر الأوزان", "قائمة فحوصات الامتثال"],
    howToUse: ["اختر المحفظة والسهم والاتجاه والكمية", "السعر الاختياري؛ إن تُرك فارغاً يُستخدم آخر سعر"],
    moreSimple: [
      "جرّب فكرة شراء أو بيع بأمان دون أمر حقيقي.",
      "شاهد كيف يتغيّر النقد والأوزان والامتثال.",
      "مفيدة قبل فتح منشئ المحفظة أو دفتر الأوامر.",
    ],
    moreTechnical: [
      "بيئة آمنة — لا ترحّل صفقات",
      "تعكس محركات التفويض وIPS الحية",
    ],
  },
  orders: {
    summary: "مسودات الأوامر (OMS): مسودة → اعتماد → إرسال → تنفيذ، ثم امتثال بعد الصفقة.",
    forWho: "مكتب التداول ومديرو المحافظ ذوو صلاحية الأوامر.",
    whatItDoes: "إنشاء أوامر مسودة وتقدّمها حتى التنفيذ.",
    whatYouGet: ["دفتر الأوامر", "إجراءات الاعتماد والإرسال والتنفيذ"],
    howToUse: ["أنشئ مسودة بالمحفظة والسهم والكمية والوسيط", "سعر التنفيذ يرحّل الصفقة عند الإذن"],
    moreSimple: [
      "أنشئ أوامر التداول الحقيقية وتابع تقدّمها.",
      "المسار المعتاد: مسودة ثم اعتماد ثم إرسال ثم تنفيذ.",
      "تنفيذ الأمر يرحّل الصفقة عندما تسمح صلاحيتك بذلك.",
    ],
    moreTechnical: [
      "التنفيذ يكتب صفقات وقد يشغّل امتثالاً بعد الصفقة",
      "ليس كل مستخدمي المرحلة الأولى يملكون هذا المسار",
    ],
  },
  sheetImport: {
    summary:
      "استيراد الأوراق للمشرف الأعلى بالترتيب: أوراق مالية → أسعار → مؤشرات → عميل → صفقات → نقد.",
    forWho: "المشرفون الأعلى الذين يعيدون بناء الدفاتر التاريخية أو يبذرونها.",
    whatItDoes: "التحقق من مفاتيح الأوراق ثم الاعتماد بالترتيب المطلوب.",
    whatYouGet: ["حالة الملف وعدد الصفوف والملاحظات", "دفعات الاعتماد واستهداف العميل"],
    howToUse: ["تحقق من كل ملف قبل الاعتماد", "التزم بالترتيب الموثّق لتجنب السجلات اليتيمة"],
    moreSimple: [
      "حمّل دفاتر العمل التاريخية بالترتيب الصحيح للحصول على دفتر نظيف.",
      "تحقق من كل ملف قبل الاعتماد.",
      "هذا المسار متاح للمشرف الأعلى فقط.",
    ],
    moreTechnical: [
      "مقصور على اسم مستخدم المشرف الأعلى",
      "يحمّل بيانات ولا يستبدل سياسة Blueprint",
    ],
  },
  ai: {
    summary: "مسودات ذكاء اصطناعي للتحليل فقط (ملخصات وتعليق آلي وبحوث) تحت قواعد الحوكمة.",
    forWho: "مديرو المحافظ الذين يصوغون السرد — وليس للاعتماد الصامت.",
    whatItDoes: "توليد مسودات حسب نوع المطالبة مع قبول أو رفض يُسجَّل في سجل الحوكمة.",
    whatYouGet: ["أوضاع المطالبات", "معاينة المسودة", "سجل القبول/الرفض"],
    howToUse: ["اختر نوع المطالبة ومحفظة اختيارية", "يجب قبول بشري قبل اعتبار المحتوى صادراً"],
    moreSimple: [
      "الذكاء الاصطناعي يساعد على صياغة الملخصات والملاحظات ولا يقرر نيابة عنك.",
      "ولّد مسودة ثم يقبلها أو يرفضها شخص.",
      "لا تستخدم مخرجات الذكاء الاصطناعي لاعتماد صفقات أو رسوم أو تجاوز امتثال.",
    ],
    moreTechnical: [
      "ممنوع تنفيذ صفقات أو اعتماد رسوم أو تجاوز الامتثال",
      "تحليل فقط وفق D-006 وBlueprint §17",
    ],
  },
  commentary: {
    summary: "التعليق الآلي: توليد → قبول أو تعديل بشري → إصدار الحزمة.",
    forWho: "كتّاب تقارير سرد العميل والأصول المدارة ولجنة الاستثمار.",
    whatItDoes: "مسودات تعليق مع قبول ورفض ثم تعليمها كصادرة.",
    whatYouGet: ["شبكة النوع/الفترة/الحالة", "مسار تحرير النص", "بوابة الإصدار"],
    howToUse: ["ولّد مسودة ذكاء اصطناعي ثم عدّل واقبل ثم علّمها صادرة"],
    moreSimple: [
      "اكتب وأصدر حزم سرد للعملاء أو الأصول المدارة أو لجنة الاستثمار.",
      "ولّد النص أو عدّله، اقبله، ثم علّمه صادراً.",
      "لا تُصدر دون خطوة قبول بشري.",
    ],
    moreTechnical: ["الإصدار بلا قبول بشري يخالف الرقابة المقصودة"],
  },
  scenarios: {
    summary: "سيناريوهات ضغط وصدمة تمتد من محاكي التداول.",
    forWho: "مديرو المحافظ المهتمون بالمخاطر عند استكشاف الصدمات وضغط السيولة.",
    whatItDoes: "تشغيل أنواع سيناريو مسماة (صدمة سعر، نشر نقد، وغيرها).",
    whatYouGet: ["قائمة نتائج السيناريوهات", "مدخلات نسبة الصدمة"],
    howToUse: ["اختر المحفظة والنوع", "اقرأ النتيجة كماذا-لو استشاري"],
    moreSimple: [
      "شغّل صدمات افتراضية مثل تحركات الأسعار أو نشر النقد.",
      "النتائج استشارية تساعد على التفكير ولا تستبدل تنبيهات المخاطر.",
      "اختر محفظة ونوع سيناريو ثم راجع الأثر.",
    ],
    moreTechnical: ["لا يستبدل تنبيهات مراقب المخاطر الرسمي"],
  },
  frontier: {
    summary: "تخصيص استشاري بأسلوب الحدّ الكفء — المنهجية قد تكون غير مؤكدة.",
    forWho: "البحوث التي تستكشف مقترحات الأوزان.",
    whatItDoes: "تشغيل تخصيص استشاري وعرض الأوزان المقترحة.",
    whatYouGet: ["الرمز / القطاع / الوزن المقترح"],
    howToUse: ["عامل المخرجات كاستشارية حتى تأكيد المنهجية"],
    moreSimple: [
      "يقترح أوزان محفظة بأسلوب الحدّ الكفء.",
      "اعتبر النتائج أفكاراً بحثية حتى تُؤكَّد المنهجية.",
      "شغّل الامتثال دائماً قبل اعتبار الأوزان قابلة للاستثمار.",
    ],
    moreTechnical: ["لا يُعد ممتثلاً لـ IPS دون تشغيل فحص امتثال"],
  },
  fees: {
    summary: "الرسوم والعمولات (خصم وإدارة وأداء) — ترحيل النقد يتم بعد الاعتماد فقط.",
    forWho: "العمليات والاستثمار لمراجعة تشغيلات الرسوم (بوابات بأسلوب F-02).",
    whatItDoes: "توليد الرسوم وتصفيةها واعتمادها أو رفضها.",
    whatYouGet: ["مبالغ قيد الانتظار ومعتمدة", "اعتماد أو رفض جماعي مع سبب لسجل التدقيق"],
    howToUse: ["ولّد لفترة محددة", "حدد الصفوف قيد الانتظار", "اعتمد أو ارفض مع ذكر السبب"],
    moreSimple: [
      "راجع رسوم الإدارة والأداء وما يرتبط بها.",
      "ولّد الرسوم لفترة ثم اعتمد أو ارفض مع سبب.",
      "لا يُرحَّل النقد قبل الاعتماد؛ لا يوجد خصم تلقائي صامت.",
    ],
    moreTechnical: [
      "لا خصم تلقائي دون نموذج حالة الاعتماد",
      "شرائح الرسوم موجودة على تفويض العميل",
    ],
  },
  opsForms: {
    summary: "أحداث سير عمل العمليات F-01–F-06 (انتهاء، اعتماد رسوم، تجديد، وغيرها).",
    forWho: "فرق العمليات والرقابة والحوكمة.",
    whatItDoes: "إنشاء وتتبع أحداث النماذج لقوائم حوكمة.",
    whatYouGet: ["رمز النموذج والحالة وتاريخ الإنشاء والإجراءات"],
    howToUse: ["أنشئ حدث F-0x المناسب وأكمل مسار حالته"],
    moreSimple: [
      "قوائم تشغيلية مرمّزة من F-01 إلى F-06.",
      "أنشئ حدث النموذج المطلوب وتابعه حتى اكتماله.",
      "تُستخدم لتتبع الحوكمة مثل الانتهاء واعتماد الرسوم والتجديد.",
    ],
    moreTechnical: ["سطح حوكمة للمرحلة الثانية — لا يستبدل قواعد رسوم العقد بصمت"],
  },
  reconciliation: {
    summary: "تشغيلات مطابقة تشكّل بوابة قبل إصدار التقارير.",
    forWho: "العمليات قبل نشر حزم العميل أو الأصول المدارة أو لجنة الاستثمار.",
    whatItDoes: "تسجيل حالة المطابقة بتاريخ معيّن وأعلام الحيازات.",
    whatYouGet: ["قائمة التشغيلات", "الحالة والأعلام"],
    howToUse: ["شغّل المطابقة قبل إنشاء حزم التقارير"],
    moreSimple: [
      "تأكد من تطابق الدفاتر والحيازات قبل نشر التقارير.",
      "شغّل المطابقة وراجع أعلام الحالة.",
      "عند اشتراط السياسة انتظر مطابقة نظيفة قبل حزم التقارير.",
    ],
    moreTechnical: ["التقارير يجب أن تنتظر مطابقة نظيفة عندما تتطلب السياسة ذلك"],
  },
  reports: {
    summary: "حزم تقارير العميل والأصول المدارة ولجنة الاستثمار بصيغ مناسبة للطباعة.",
    forWho: "فرق التقارير وعلاقات العملاء.",
    whatItDoes: "إنشاء حزم حسب النوع والفترة والطباعة عبر حوار المتصفح.",
    whatYouGet: ["قائمة الحزم", "ملخص الأصول المدارة وعينة حيازات", "إجراء الطباعة"],
    howToUse: ["أنشئ الحزمة بعد المطابقة عند اللزوم", "اسمح بالنوافذ المنبثقة للطباعة"],
    moreSimple: [
      "أنشئ حزم تقارير للعميل أو الأصول المدارة أو اللجنة لفترة مختارة.",
      "اطبع عبر حوار طباعة المتصفح.",
      "اسمح بالنوافذ المنبثقة إذا لم تُفتح الطباعة.",
    ],
    moreTechnical: ["الطباعة عبر المتصفح وليست تذكرة أوامر منفصلة"],
  },
  statements: {
    summary: "كشوفات العملاء من دفتر SQL بنفس أنواع نظام التداول: محفظة، حساب، أرباح محققة مختصر وتفصيلي.",
    forWho: "مديرو المحافظ والعمليات لطباعة كشوف حتى تاريخ أو لفترة لأي مستثمر في SQL.",
    whatItDoes: "تحمّل JSON الكشف من الخادم وتعرض جداول معاينة. لا تعيد حساب الأموال في المتصفح.",
    whatYouGet: [
      "أربعة أنواع تطابق PDF نظام التداول الحالي",
      "تاريخ حتى أو من/إلى حسب النوع",
      "معاينة شاشة وطباعة مؤقتة (مطابقة التخطيط الخطوة التالية)",
    ],
    howToUse: [
      "اختر عميلاً ونوعاً وتواريخ ثم أنشئ",
      "أو افتح الكشوفات من صفحة العميل بتاريخ حتى الحالي",
      "الخلايا الفارغة في التذييل تعني أن المعادلة غير مؤكدة — وليست صفراً",
    ],
    moreSimple: [
      "اطبع كشوفات العملاء كما في نظام التداول الحالي.",
      "اختر المستثمر والتواريخ؛ الخادم يرسل الأرقام.",
      "هذه ليست صفحة تقارير الأصول المدارة المقفلة.",
    ],
    moreTechnical: [
      "GET /api/ext/clients/:id/statements/… — SQL للقراءة فقط",
      "إغلاق رسمي فقط في كشف المحفظة؛ ممنوع الاحتياط بآخر صفقة",
      "/reports تبقى مقفلة (حزم Blueprint)",
    ],
  },
  balances: {
    summary: "مطابقة يومية للقطة QSC (ClientPortfolioSnapshot) مع إعادة بناء IPMS من دفتر SQL والإغلاق الرسمي.",
    forWho: "المحاسب والعمليات للتحقق من قيمة المحفظة ونقد النظام مقابل IPMS.",
    whatItDoes: "يقرأ لقطة SQL الساعة 15:00 (قراءة فقط) ويخزّن صف مقارنة Cloudilic في Postgres. لا يكتب على SQL.",
    whatYouGet: [
      "قيمة محفظة QSC مقابل القيمة السوقية ومقابل سوق+نقد (تعريف القيمة غير موقَّع)",
      "نقد نظام QSC مقابل دفتر نقد IPMS",
      "البنك من QSC فقط — مصدر بنك IPMS غير معروف",
    ],
    howToUse: [
      "اختر تاريخ اللقطة (عادة بعد 15:00 بتوقيت قطر)",
      "شغّل المقارنة إن صُرّح لك (admin/pm/approver/compliance)",
      "مطابق يعني النقد متوافق وقيمة المحفظة تساوي السوق أو سوق+نقد ضمن 0.01 ريال",
    ],
    moreSimple: [
      "تأكد أن أرصدة QSC تطابق هذا النظام في نفس اليوم.",
      "المطابقة الخضراء ليست اعتماد NAV — عمودا تعريف القيمة يبقيان ظاهرين.",
      "ليست صفحة مطابقة الأوامر المقفلة.",
    ],
    moreTechnical: [
      "GET/POST /api/snapshots — جدول ipms_client_snapshots",
      "ClientPortfolioSnapshot للقراءة فقط؛ المفتاح ClientId = Investors.CL_CLIENT_ID",
      "إغلاق رسمي فقط؛ ممنوع الاحتياط بآخر صفقة",
    ],
  },
  live: {
    summary: "غرفة انتظار لبث جلسة QSC. لا اتصال حتى يتوفر الرابط وعيّنات JSON.",
    forWho: "مديرو المحافظ الذين يراقبون أسعار الجلسة. ليست للكشف التاريخي.",
    whatItDoes: "تعرض إن كان البث مضبوطًا. لا تكتب إغلاقًا رسميًا من تكات حية.",
    whatYouGet: [
      "الحالة: غير متصل حتى الإجابة على أسئلة 23–25",
      "أسماء الكائنات الخمسة التي سمّاها QSC",
    ],
    howToUse: [
      "اترك الصفحة حتى يرسل QSC الرابط والمصادقة وعيّنات JSON الخمس",
      "لا تعامل آخر سعر حي كإغلاق كشف",
    ],
    moreSimple: [
      "هذا شريط الجلسة، ليس كشف نهاية اليوم.",
      "لا بث يعمل بعد.",
    ],
    moreTechnical: [
      "GET /api/live/status — لا عميل WebSocket حتى العيّنات",
      "BROADCAST_WS_URL في البيئة؛ لن يتصل بلا عيّنات JSON (D-016)",
      "ممنوع كتابة stock_prices من هذا البث ما لم يوقّع QSC السؤال 25",
    ],
  },
  workshop: {
    summary: "غرفة انتظار لقرارات المنتج المفتوحة. تعرض ما يفعله الكود اليوم. ليست توقيعًا على BD.",
    forWho: "مديرو المحافظ والامتثال ومن يجهّز ورشة QSC. ليست شاشة اعتماد استثمار.",
    whatItDoes: "تسرد BD-001…011 وأسئلة التسليم 16 و18 و19 و27–31 مع واقع التنفيذ الحالي.",
    whatYouGet: [
      "نص السؤال للعميل",
      "وقائع «الكود اليوم» من سجل القرارات",
      "الحالة تبقى موقوفة حتى يوقّع مالك مسمّى صف D-*",
    ],
    howToUse: [
      "أرسل الأسئلة المدرجة؛ لا تختر خيارًا من الواجهة",
      "لا تُرجع الشريعة أ/ب/ج ولا تخترع عطلًا ولا تفك قفل OMS من هذه الصفحة",
    ],
    moreSimple: [
      "هذه أسئلة منتج ما زال العميل يجيب عليها.",
      "الجدول يعرض ما يفعله النظام اليوم — وهذا ليس السياسة الموقَّعة.",
    ],
    moreTechnical: [
      "GET /api/product-decisions — signed يبقى false",
      "لا POST. المحركات والمخطط و0008 بلا تغيير",
    ],
  },
  uat: {
    summary: "غرفة انتظار لقبول المرحلة 1. لا تشغّل قائمة 09 ولا تفك الصفحات المتأخرة.",
    forWho: "مديرو المحافظ والمشرفون. ليست إعلانًا أن المرحلة 1 منتهية.",
    whatItDoes: "تسرد لماذا لا يبدأ UAT: إغلاقات ناقصة، تذييل بلا توقيع، تعارض الشريعة، لا مالك مسمّى.",
    whatYouGet: [
      "runnable يبقى false",
      "تذكير أن 10-GAP-ANALYSIS ليست حالة حية",
      "OMS / الرسوم / Next.js تبقى مقفولة",
    ],
    howToUse: [
      "لا تعلّم 09 من هذه الصفحة",
      "انتظر إغلاقات بعد 2026-08-19 وتوقيع QSC",
    ],
    moreSimple: [
      "المرحلة 1 ليست منتهية لمجرد وجود شاشات.",
      "هذه الصفحة تشرح ما يزال موقوفًا.",
    ],
    moreTechnical: [
      "GET /api/uat/status — runnable وphase1Accepted يبقيان false",
      "لا تعامل 10-GAP-ANALYSIS.md كحالة حالية",
    ],
  },
  compliance: {
    summary: "اختبارات الإذن للامتثال: قبل المقترح وقبل الصفقة وبعدها مقابل التفويض وIPS.",
    forWho: "مسؤولو الامتثال ومديرو المحافظ الذين يعالجون المخالفات.",
    whatItDoes: "تشغيل الفحوصات ومراجعة النتائج وطلب الاستثناءات أو البتّ فيها.",
    whatYouGet: ["نتائج ناجح/فاشل", "طلبات استثناء", "قرارات مدعومة بسجل التدقيق"],
    howToUse: ["اختر محفظة", "شغّل الفحوصات", "اطلب استثناء مع السبب ومدة الصلاحية"],
    moreSimple: [
      "تتحقق مما إذا كان ما اقترحته مسموحاً وفق التفويض وIPS.",
      "شغّل الفحوصات وراجع ناجح/فاشل واطلب استثناء عند الحاجة.",
      "الامتثال يتعلق بالإذن؛ المخاطر شاشة خطر منفصلة.",
    ],
    moreTechnical: [
      "الامتثال ≠ المخاطر — أبقِهما منفصلين",
      "الاستثناءات تُكتب في سجل التدقيق",
    ],
  },
  risk: {
    summary: "مراقب المخاطر: تنبيهات التركيز والانخفاض والسيولة والتنظيم.",
    forWho: "مالكو المخاطر ومديرو المحافظ الذين يعالجون التنبيهات المفتوحة.",
    whatItDoes: "مسح المحافظ وتعيين التنبيهات وحلها أو التنازل عنها مع أسباب.",
    whatYouGet: ["طوابير مفتوح / تم الحل / تم التنازل", "تواريخ الاستحقاق والملاك", "مسح الكل أو محفظة واحدة"],
    howToUse: ["امسح الآن", "عيّن لي", "حل أو تنازل مع سبب لسجل التدقيق"],
    moreSimple: [
      "تراقب أوضاعاً خطرة مثل التركيز أو الخسائر أو ضعيف السيولة.",
      "امسح المحافظ وعيّن التنبيهات ثم حلّها أو تنازل عنها مع سبب.",
      "هذه شاشة المخاطر — منفصلة عن فحوصات إذن الامتثال.",
    ],
    moreTechnical: [
      "عتبات IPS (مثل 15%/20% للسهم و35%/40% للقطاع) تحرّك كثيراً من التنبيهات",
      "المسح يجب أن يكون عديم التكرار وألا يضاعف التنبيهات المفتوحة بلا داعٍ",
    ],
  },
  audit: {
    summary: "سجل التدقيق: أدلة غير قابلة للتغيير لإنشاءات وتحديثات واعتمادات وتجاوزات حساسة.",
    forWho: "الامتثال وسجل التدقيق والمشرفون الذين يعيدون بناء القرارات.",
    whatItDoes: "تصفية الأحداث زمنياً حسب الإجراء والعنصر.",
    whatYouGet: ["وقت الحدوث / المستخدم / الإجراء / العنصر / السبب"],
    howToUse: ["ضيّق حسب نوع الإجراء أو العنصر", "انقل النتائج إلى ملاحظات التحقيق"],
    moreSimple: [
      "سجل دائم لمن فعل ماذا في الإجراءات الحساسة.",
      "صفِّ حسب نوع الإجراء أو العنصر عند التحقيق.",
      "صفوف التاريخ غير معدة للتعديل.",
    ],
    moreTechnical: [
      "الأسباب مطلوبة في كثير من مسارات التعديل",
      "لا تتوقع صفوفاً تاريخية قابلة للتعديل",
    ],
  },
  users: {
    summary: "حسابات موظفي النظام (الأدوار ترتبط ببوابات requireRole في واجهة البرمجة).",
    forWho: "المسؤولون فقط.",
    whatItDoes: "إنشاء وتعديل وتعطيل مستخدمي الموظفين وإعادة تعيين كلمات المرور.",
    whatYouGet: ["اسم المستخدم واسم العرض والدور والحالة"],
    howToUse: ["أنشئ مستخدماً مع دور", "عدّل لتعيين كلمة مرور جديدة (يُفرض حد أدنى للطول)"],
    moreSimple: [
      "إدارة تسجيلات دخول الموظفين وأدوارهم في النظام.",
      "أنشئ مستخدمين وعدّل التفاصيل أو عطّل الحسابات أو أعد تعيين كلمات المرور.",
      "لا يمكنك حذف تسجيل دخولك الحالي.",
    ],
    moreTechnical: [
      "لا يمكن حذف حسابك الحالي",
      "تغيير الدور يؤثر فوراً على الوصول إلى المسارات",
    ],
  },
  systemConfig: {
    summary: "عتبات IPS وأعلام الميزات وأدوات تصنيف الأسهم الحلال والإغلاق الرسمي للمشرف الأعلى.",
    forWho: "المشرف الأعلى فقط.",
    whatItDoes: "تعديل مفاتيح الإعداد ووسوم الحلال وأسعار الإغلاق الرسمية المستخدمة في الكشوفات.",
    whatYouGet: ["تبويب قواعد IPS", "تبويب الأعلام", "تبويب الأسهم الحلال", "تبويب الإغلاق الرسمي"],
    howToUse: ["غيّر قيمة ثم احفظ", "في الإغلاق الرسمي: حمّل CB_PRICES من KB أو أضف رمزاً وتاريخاً وسعراً"],
    moreSimple: [
      "إعدادات على مستوى الشركة لحدود IPS وأعلام الميزات ومساعدات الحلال.",
      "غيّر أي قيمة بحذر ثم احفظ.",
      "أرقام IPS الخاطئة قد تؤثر على الامتثال والمخاطر في كل المحافظ.",
    ],
    moreTechnical: [
      "خطأ في أرقام IPS يؤثر على الامتثال والمخاطر على مستوى الشركة كلها",
      "اجعل التغيير مقصوداً وقابلاً للتدقيق",
    ],
  },
};

export function getNavPageGuide(href: string, locale: AppLocale): NavPageGuide | null {
  const id = NAV_GUIDE_ID_BY_HREF[href];
  if (!id) return null;
  const pack = locale === "ar" ? AR : EN;
  return pack[id] ?? EN[id] ?? null;
}
