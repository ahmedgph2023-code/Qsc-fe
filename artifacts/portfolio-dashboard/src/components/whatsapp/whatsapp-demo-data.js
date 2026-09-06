/** Client-preview demo data — not used when demo mode is off. */

const DEMO_CONFIG_1 = "demo-wa-config-1";
const DEMO_CONFIG_2 = "demo-wa-config-2";

const now = Date.now();
const mins = (m) => new Date(now - m * 60_000).toISOString();
const hours = (h) => new Date(now - h * 3_600_000).toISOString();

export const DEMO_ACCOUNTS = [
  {
    id: DEMO_CONFIG_1,
    label: "QSC Client Line",
    enabled: true,
    phoneNumberId: "97444123456",
    wabaId: "demo-waba-qsc",
    displayPhoneNumber: "+974 4412 3456",
    connectionStatus: "connected",
    lastValidatedAt: mins(30),
    lastError: null,
    webhookPath: "/api/whatsapp/webhook",
    webhookCallbackUrl: "https://api.example.com/api/whatsapp/webhook",
    webhookUrlHint: "https://api.example.com/api/whatsapp/webhook",
    verifyToken: "qsc-demo-verify",
    accessToken: "demo-access-token",
    appSecret: "demo-app-secret",
    hasAccessToken: true,
    accessTokenHint: "••••oken",
    hasAppSecret: true,
    appSecretHint: "••••ret",
    hasVerifyToken: true,
    verifyTokenHint: "••••ify",
    graphApiVersion: "v21.0",
    updatedAt: mins(5),
  },
  {
    id: DEMO_CONFIG_2,
    label: "Operations Desk",
    enabled: true,
    phoneNumberId: "97455001122",
    wabaId: "demo-waba-ops",
    displayPhoneNumber: "+974 5500 1122",
    connectionStatus: "connected",
    lastValidatedAt: mins(120),
    lastError: null,
    webhookPath: "/api/whatsapp/webhook",
    webhookCallbackUrl: "https://api.example.com/api/whatsapp/webhook",
    webhookUrlHint: "https://api.example.com/api/whatsapp/webhook",
    verifyToken: "qsc-demo-verify-2",
    accessToken: "demo-access-token-2",
    appSecret: "demo-app-secret-2",
    hasAccessToken: true,
    accessTokenHint: "••••ken2",
    hasAppSecret: true,
    appSecretHint: "••••et2",
    hasVerifyToken: true,
    verifyTokenHint: "••••fy2",
    graphApiVersion: "v21.0",
    updatedAt: hours(2),
  },
];

export const DEMO_CONVERSATIONS = [
  {
    id: "demo-conv-1",
    configId: DEMO_CONFIG_1,
    waId: "97433112233",
    displayName: "Ahmed Al-Kuwari",
    businessName: null,
    lastMessagePreview: "Thank you — please send the November statement.",
    lastMessageAt: mins(8),
    lastInboundAt: mins(8),
    unreadCount: 2,
    isFavorite: true,
    withinCustomerCareWindow: true,
    customerCareExpiresAt: new Date(now + 16 * 3_600_000).toISOString(),
  },
  {
    id: "demo-conv-2",
    configId: DEMO_CONFIG_1,
    waId: "97455114455",
    displayName: "Fatima Al-Naimi",
    businessName: "Al-Naimi Holdings",
    lastMessagePreview: "Portfolio rebalance completed as discussed.",
    lastMessageAt: mins(45),
    lastInboundAt: hours(3),
    unreadCount: 0,
    isFavorite: false,
    withinCustomerCareWindow: false,
    customerCareExpiresAt: null,
  },
  {
    id: "demo-conv-3",
    configId: DEMO_CONFIG_1,
    waId: "97466998877",
    displayName: "Mohammed Al-Sulaiti",
    businessName: null,
    lastMessagePreview: "What is my current cash balance?",
    lastMessageAt: mins(15),
    lastInboundAt: mins(15),
    unreadCount: 1,
    isFavorite: false,
    withinCustomerCareWindow: true,
    customerCareExpiresAt: new Date(now + 23 * 3_600_000).toISOString(),
  },
  {
    id: "demo-conv-4",
    configId: DEMO_CONFIG_1,
    waId: "97477001234",
    displayName: "Sara Al-Mansouri",
    businessName: null,
    lastMessagePreview: "Received the QERI benchmark summary.",
    lastMessageAt: hours(2),
    lastInboundAt: hours(5),
    unreadCount: 0,
    isFavorite: true,
    withinCustomerCareWindow: false,
    customerCareExpiresAt: null,
  },
  {
    id: "demo-conv-5",
    configId: DEMO_CONFIG_1,
    waId: "97444556677",
    displayName: "Khalid Al-Hajri",
    businessName: "Gulf Capital Partners",
    lastMessagePreview: "Can we schedule a call about IPS limits?",
    lastMessageAt: hours(6),
    lastInboundAt: hours(6),
    unreadCount: 0,
    isFavorite: false,
    withinCustomerCareWindow: false,
    customerCareExpiresAt: null,
  },
];

const DEMO_MESSAGES = {
  "demo-conv-1": [
    {
      id: "demo-msg-1a",
      conversationId: "demo-conv-1",
      direction: "outbound",
      messageType: "template",
      body: "Hello Ahmed, your portfolio statement for October is ready. Reply if you need a PDF copy.",
      templateName: "portfolio_statement",
      templateLanguage: "en",
      status: "read",
      createdAt: hours(4),
    },
    {
      id: "demo-msg-1b",
      conversationId: "demo-conv-1",
      direction: "inbound",
      messageType: "text",
      body: "Thank you — please send the November statement.",
      status: "received",
      createdAt: mins(8),
    },
    {
      id: "demo-msg-1c",
      conversationId: "demo-conv-1",
      direction: "inbound",
      messageType: "text",
      body: "Also confirm my QERI benchmark allocation.",
      status: "received",
      createdAt: mins(7),
    },
  ],
  "demo-conv-2": [
    {
      id: "demo-msg-2a",
      conversationId: "demo-conv-2",
      direction: "outbound",
      messageType: "text",
      body: "Hi Fatima — we propose selling 200 QNBK and adding to QEWS to bring sector weights back within IPS.",
      status: "delivered",
      createdAt: hours(2),
    },
    {
      id: "demo-msg-2b",
      conversationId: "demo-conv-2",
      direction: "inbound",
      messageType: "text",
      body: "Approved. Proceed with the rebalance.",
      status: "received",
      createdAt: hours(1.5),
    },
    {
      id: "demo-msg-2c",
      conversationId: "demo-conv-2",
      direction: "outbound",
      messageType: "text",
      body: "Portfolio rebalance completed as discussed. Cash remaining: QAR 142,500.",
      status: "read",
      createdAt: mins(45),
    },
  ],
  "demo-conv-3": [
    {
      id: "demo-msg-3a",
      conversationId: "demo-conv-3",
      direction: "inbound",
      messageType: "text",
      body: "What is my current cash balance?",
      status: "received",
      createdAt: mins(15),
    },
  ],
  "demo-conv-4": [
    {
      id: "demo-msg-4a",
      conversationId: "demo-conv-4",
      direction: "outbound",
      messageType: "template",
      body: "Your QERI vs portfolio attribution summary for Q3 is attached in the client portal.",
      templateName: "benchmark_summary",
      templateLanguage: "en",
      status: "read",
      createdAt: hours(3),
    },
    {
      id: "demo-msg-4b",
      conversationId: "demo-conv-4",
      direction: "inbound",
      messageType: "text",
      body: "Received the QERI benchmark summary.",
      status: "received",
      createdAt: hours(2),
    },
  ],
  "demo-conv-5": [
    {
      id: "demo-msg-5a",
      conversationId: "demo-conv-5",
      direction: "inbound",
      messageType: "text",
      body: "Can we schedule a call about IPS limits?",
      status: "received",
      createdAt: hours(6),
    },
  ],
};

export const DEMO_TEMPLATES = [
  {
    id: "demo-tpl-1",
    name: "portfolio_statement",
    language: "en",
    status: "APPROVED",
    category: "UTILITY",
    components: [
      { type: "BODY", text: "Hello {{1}}, your portfolio statement for {{2}} is ready." },
    ],
  },
  {
    id: "demo-tpl-2",
    name: "rebalance_notice",
    language: "en",
    status: "APPROVED",
    category: "UTILITY",
    components: [
      { type: "BODY", text: "Your portfolio rebalance for {{1}} has been executed." },
    ],
  },
  {
    id: "demo-tpl-3",
    name: "benchmark_summary",
    language: "en",
    status: "APPROVED",
    category: "MARKETING",
    components: [
      { type: "BODY", text: "QSC: Your benchmark attribution summary for {{1}} is available." },
    ],
  },
  {
    id: "demo-tpl-4",
    name: "portfolio_statement",
    language: "ar",
    status: "APPROVED",
    category: "UTILITY",
    components: [
      { type: "BODY", text: "مرحباً {{1}}، كشف محفظتك لشهر {{2}} جاهز." },
    ],
  },
];

export const DEMO_FILTER_COUNTS = {
  all: 5,
  unread: 2,
  unreadMessages: 3,
  leads: 0,
  fav: 2,
  replied: 1,
  unreplied: 2,
  window24h: 2,
};

export const DEMO_ACTIVITY = [
  { id: "demo-act-1", event: "message.sent.text", createdAt: mins(45), payload: { conversationId: "demo-conv-2" } },
  { id: "demo-act-2", event: "webhook.messages_received", createdAt: mins(8), payload: { count: 2 } },
  { id: "demo-act-3", event: "config.validated", createdAt: mins(30), payload: { wabaId: "demo-waba-qsc" } },
];

/** Mutable outbound messages appended during demo session */
const demoOutbound = [];
const demoQuickReplies = [
  { id: "demo-qr-1", title: "Statement ready", body: "Your latest portfolio statement is ready. Reply if you need a PDF copy." },
  { id: "demo-qr-2", title: "Hold for review", body: "Noted — the investment team will review this and get back to you." },
];

export function demoApi() {
  return {
    status: () => Promise.resolve({ ...DEMO_ACCOUNTS[0] }),
    saveConfig: (payload) =>
      Promise.resolve({ ...DEMO_ACCOUNTS[0], ...payload, id: DEMO_CONFIG_1 }),
    validate: () => Promise.resolve({ ...DEMO_ACCOUNTS[0], validation: { wabaName: "QSC Demo WABA" } }),
    setEnabled: (enabled) => Promise.resolve({ ...DEMO_ACCOUNTS[0], enabled }),
    templates: () => Promise.resolve([...DEMO_TEMPLATES]),
    activity: () => Promise.resolve([...DEMO_ACTIVITY]),
    conversations: (params = {}) => {
      let rows = [...DEMO_CONVERSATIONS];
      const term = String(params.q || "").trim().toLowerCase();
      if (term) {
        const digits = term.replace(/\D/g, "");
        rows = rows.filter(
          (c) =>
            (c.displayName || "").toLowerCase().includes(term) ||
            (c.businessName || "").toLowerCase().includes(term) ||
            (digits && c.waId.includes(digits)),
        );
      }
      const f = String(params.filter || "all");
      if (f === "unread") rows = rows.filter((c) => (c.unreadCount || 0) > 0);
      if (f === "fav") rows = rows.filter((c) => c.isFavorite);
      if (f === "window24h") rows = rows.filter((c) => c.withinCustomerCareWindow);
      if (f === "unreplied") {
        rows = rows.filter(
          (c) =>
            c.lastInboundAt &&
            c.lastMessageAt &&
            new Date(c.lastInboundAt).getTime() >= new Date(c.lastMessageAt).getTime(),
        );
      }
      if (f === "replied") {
        rows = rows.filter(
          (c) =>
            c.lastMessageAt &&
            (!c.lastInboundAt || new Date(c.lastMessageAt).getTime() > new Date(c.lastInboundAt).getTime()),
        );
      }
      if (f === "leads") rows = rows.filter((c) => (c.unreadCount || 0) > 0 && !c.isFavorite);
      return Promise.resolve(rows);
    },
    conversationFilterCounts: () => Promise.resolve({ ...DEMO_FILTER_COUNTS }),
    conversation: (id) => {
      const c = DEMO_CONVERSATIONS.find((x) => x.id === id);
      if (!c) return Promise.reject(new Error("Conversation not found"));
      return Promise.resolve({ ...c });
    },
    messages: (id) => {
      const base = [...(DEMO_MESSAGES[id] || []), ...demoOutbound.filter((m) => m.conversationId === id)];
      return Promise.resolve(base.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    },
    markRead: (id) => {
      const c = DEMO_CONVERSATIONS.find((x) => x.id === id);
      if (c) c.unreadCount = 0;
      return Promise.resolve({ ...c });
    },
    syncConversation: (id) => demoApi().messages(id).then((messages) => ({
      conversation: DEMO_CONVERSATIONS.find((x) => x.id === id),
      messages,
      canSendFreeform: true,
    })),
    syncFromMeta: () => {
      const messageCount = Object.values(DEMO_MESSAGES).reduce((n, list) => n + list.length, 0);
      return Promise.resolve({
        ok: true,
        pulled: {
          phone: {
            phoneNumberId: "demo",
            displayPhoneNumber: "+974 0000 0000",
            verifiedName: "QSC Demo",
            qualityRating: "GREEN",
            wabaId: "demo-waba",
            wabaName: "Demo WABA",
          },
          templates: { count: 0 },
          businessProfile: null,
          webhookSubscription: { subscribed: false, apps: [], error: null },
        },
        local: { conversations: DEMO_CONVERSATIONS.length, messages: messageCount },
        history: {
          availableViaGraphPull: false,
          webhookMaxDays: 180,
          webhookMediaDays: 14,
          lastChunk: null,
          lastDecline: null,
          note: "WhatsApp Business app onboarding by a solution provider, with the business agreeing to share chat history",
        },
        can: [
          {
            key: "demo",
            available: true,
            reason: "Demo preview only. Live sync talks to Meta Graph for templates and phone profile.",
          },
        ],
        cannot: [
          {
            key: "chat_history_via_graph",
            available: false,
            reason:
              "WhatsApp Cloud API has no GET for conversations or message bodies. Past chats from another Cloud API CRM are not stored at Meta.",
          },
        ],
      });
    },
    importWebhookDump: () =>
      Promise.reject(new Error("Webhook JSON import is not available in demo preview.")),
    setConversationFavorite: (id, isFavorite) => {
      const c = DEMO_CONVERSATIONS.find((x) => x.id === id);
      if (c) c.isFavorite = isFavorite;
      return Promise.resolve({ ...c });
    },
    downloadPhoneTemplate: () => {
      const csv = [
        "phone,display_name",
        "97433112233,Ahmed Al-Kuwari",
        "33114455,Sara",
        "01012345678,Invalid example — delete this row",
      ].join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "whatsapp-phones-template.csv";
      a.click();
      URL.revokeObjectURL(url);
      return Promise.resolve();
    },
    previewPhoneImport: async (file) => {
      const text = await file.text();
      const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
      const rows = [];
      for (let i = 1; i < lines.length; i += 1) {
        const [phone, displayName] = lines[i].split(",").map((c) => String(c || "").trim());
        if (!phone && !displayName) continue;
        let digits = String(phone || "").replace(/\D/g, "");
        if (digits.startsWith("00")) digits = digits.slice(2);
        if (/^[34567]\d{7}$/.test(digits)) digits = `974${digits}`;
        const ok = Boolean(digits && !digits.startsWith("0") && digits.length >= 10 && digits.length <= 15);
        rows.push({
          row: i + 1,
          phone: phone || "",
          displayName: displayName || "",
          waId: ok ? digits : null,
          ok,
          error: ok
            ? null
            : phone
              ? "Invalid phone. Use Qatar country code (10–15 digits), e.g. 97433112233"
              : "Phone is required",
        });
      }
      return { rows };
    },
    openPhone: (phone, displayName) => {
      const waId = String(phone).replace(/\D/g, "") || "97400000000";
      const conv = {
        id: `demo-conv-new-${waId}`,
        configId: DEMO_CONFIG_1,
        waId,
        displayName: displayName || waId,
        unreadCount: 0,
        withinCustomerCareWindow: true,
        lastMessageAt: new Date().toISOString(),
      };
      DEMO_CONVERSATIONS.unshift(conv);
      DEMO_MESSAGES[conv.id] = [];
      return Promise.resolve(conv);
    },
    sendText: ({ conversationId, text }) => {
      const msg = {
        id: `demo-out-${Date.now()}`,
        conversationId,
        direction: "outbound",
        messageType: "text",
        body: text,
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      demoOutbound.push(msg);
      const c = DEMO_CONVERSATIONS.find((x) => x.id === conversationId);
      if (c) {
        c.lastMessagePreview = text;
        c.lastMessageAt = msg.createdAt;
      }
      return Promise.resolve(msg);
    },
    sendTemplate: ({ conversationId, templateName, language }) => {
      const msg = {
        id: `demo-tpl-out-${Date.now()}`,
        conversationId,
        direction: "outbound",
        messageType: "template",
        body: `[Template: ${templateName}]`,
        templateName,
        templateLanguage: language || "en",
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      demoOutbound.push(msg);
      return Promise.resolve(msg);
    },
    sendMedia: ({ conversationId, file, caption, asVoice }) => {
      const type = asVoice
        ? "voice"
        : String(file?.type || "").startsWith("image/")
          ? "image"
          : String(file?.type || "").startsWith("audio/")
            ? "audio"
            : String(file?.type || "").startsWith("video/")
              ? "video"
              : "document";
      const msg = {
        id: `demo-media-${Date.now()}`,
        conversationId,
        direction: "outbound",
        messageType: type,
        body: caption || file?.name || type,
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      demoOutbound.push(msg);
      return Promise.resolve(msg);
    },
    listQuickReplies: () => Promise.resolve([...demoQuickReplies]),
    createQuickReply: ({ title, body }) => {
      const row = { id: `demo-qr-${Date.now()}`, title, body };
      demoQuickReplies.push(row);
      return Promise.resolve(row);
    },
    deleteQuickReply: (id) => {
      const idx = demoQuickReplies.findIndex((r) => r.id === id);
      if (idx >= 0) demoQuickReplies.splice(idx, 1);
      return Promise.resolve({ ok: true });
    },
    createTemplate: (payload) => {
      DEMO_TEMPLATES.unshift({
        id: `demo-tpl-${Date.now()}`,
        name: payload.name,
        language: payload.language || "en_US",
        status: "PENDING",
        category: payload.category || "UTILITY",
        components: [{ type: "BODY", text: payload.bodyText }],
      });
      return Promise.resolve(DEMO_TEMPLATES[0]);
    },
    updateTemplate: (id, payload) => {
      const tpl = DEMO_TEMPLATES.find((t) => t.id === id);
      if (tpl && payload.bodyText) {
        tpl.components = [{ type: "BODY", text: payload.bodyText }];
      }
      return Promise.resolve(tpl || { id });
    },
    deleteTemplate: ({ name }) => {
      const idx = DEMO_TEMPLATES.findIndex((t) => t.name === name);
      if (idx >= 0) DEMO_TEMPLATES.splice(idx, 1);
      return Promise.resolve({ success: true });
    },
    templateLibrary: () =>
      Promise.resolve({
        templates: [
          {
            libraryTemplateName: "hello_world",
            name: "hello_world",
            language: "en_US",
            category: "UTILITY",
            body: "Welcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API.",
            buttons: [],
          },
        ],
        verification: [],
      }),
    createFromLibrary: (payload) =>
      demoApi().createTemplate({
        name: payload.name,
        language: payload.language,
        category: payload.category,
        bodyText: `Library: ${payload.libraryTemplateName}`,
      }),
    uploadTemplateHeader: () => Promise.resolve({ headerHandle: "demo-header-handle" }),
    deleteAccount: (id) => {
      const idx = DEMO_ACCOUNTS.findIndex((a) => a.id === id);
      if (idx >= 0 && DEMO_ACCOUNTS.length > 1) DEMO_ACCOUNTS.splice(idx, 1);
      return Promise.resolve({ ok: true });
    },
    listAccounts: () => Promise.resolve({ accounts: [...DEMO_ACCOUNTS] }),
    usageBilling: () =>
      Promise.resolve({
        summary: {
          sent: 48,
          delivered: 45,
          read: 31,
          failed: 1,
          billableDelivered: 38,
          estimatedCostUsd: 12.4,
          estimatedCostEgp: 628.7,
          vsPreviousMonthPct: 8,
          byCategory: { UTILITY: 22, MARKETING: 12, AUTHENTICATION: 4 },
        },
        fx: { usdToEgp: 50.7 },
        byCategoryCost: { UTILITY: 4.1, MARKETING: 7.2, AUTHENTICATION: 1.1 },
        byCategoryCostEgp: { UTILITY: 208, MARKETING: 365, AUTHENTICATION: 56 },
        byCountry: [
          { country: "QA", label: "Qatar", count: 38, estimatedCostUsd: 10.5, estimatedCostEgp: 533 },
        ],
        daily: [
          { date: "2026-09-01", sent: 6, estimatedCostUsd: 1.2, estimatedCostEgp: 61 },
          { date: "2026-09-02", sent: 11, estimatedCostUsd: 2.8, estimatedCostEgp: 142 },
        ],
        rateCardSample: [
          { market: "QATAR", label: "Qatar", marketing: 0.0639, utility: 0.015, authentication: 0.014, service: 0 },
        ],
        templates: [
          { name: "portfolio_statement", category: "UTILITY", sent: 18, delivered: 17, estimatedCostUsd: 2.1, estimatedCostEgp: 106 },
        ],
        disclaimer: "Estimated Meta cost — demo preview only.",
      }),
    createAccount: (label) => {
      const acc = {
        ...DEMO_ACCOUNTS[0],
        id: `demo-config-${Date.now()}`,
        label,
        displayPhoneNumber: "+974 0000 0000",
      };
      DEMO_ACCOUNTS.push(acc);
      return Promise.resolve(acc);
    },
    getConfigId: () => DEMO_CONFIG_1,
    setConfigId: () => {},
  };
}
