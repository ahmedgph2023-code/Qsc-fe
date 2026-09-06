/**
 * Drop-in adapter for So7baFit MetaWhatsAppWorkspace — QSC /api/whatsapp + configId.
 */
import {
  getWhatsAppStatus,
  saveWhatsAppConfig,
  validateWhatsAppConfig,
  setWhatsAppEnabled,
  listWhatsAppTemplates,
  listWhatsAppConversations,
  listWhatsAppMessages,
  markWhatsAppConversationRead,
  openWhatsAppPhone,
  sendWhatsAppText,
  sendWhatsAppTemplate,
  sendWhatsAppMedia,
  getWhatsAppUsage,
  listWhatsAppQuickReplies,
  createWhatsAppQuickReply,
  updateWhatsAppQuickReply,
  deleteWhatsAppQuickReply,
  createWhatsAppTemplate,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
  listWhatsAppTemplateLibrary,
  createWhatsAppTemplateFromLibrary,
  uploadWhatsAppTemplateHeader,
  listWhatsAppAccounts,
  createWhatsAppAccount,
  deleteWhatsAppAccount,
  downloadWhatsAppPhoneTemplate,
  previewWhatsAppPhoneImport,
  syncWhatsAppFromMeta,
  importWhatsAppWebhookDump,
  getToken,
} from "@/lib/api";
import { demoApi } from "./whatsapp-demo-data.js";

const CONFIG_KEY = "qsc.whatsapp.configId";
const DEMO_KEY = "qsc.whatsapp.demoMode";

export function isWhatsAppDemoToggleVisible() {
  return Boolean(import.meta.env.DEV);
}

export function getWhatsAppDemoMode() {
  if (typeof window === "undefined") return false;
  if (!isWhatsAppDemoToggleVisible()) return false;
  try {
    return localStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

export function setWhatsAppDemoMode(on) {
  if (typeof window === "undefined") return;
  try {
    if (on && isWhatsAppDemoToggleVisible()) {
      localStorage.setItem(DEMO_KEY, "1");
    } else {
      localStorage.removeItem(DEMO_KEY);
      const stored = localStorage.getItem(CONFIG_KEY);
      if (stored === "demo-wa-config-1") localStorage.removeItem(CONFIG_KEY);
      const url = new URL(window.location.href);
      if (url.searchParams.get("configId") === "demo-wa-config-1") {
        url.searchParams.delete("configId");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("qsc-whatsapp-demo-changed"));
}

export function getWhatsAppConfigId() {
  if (getWhatsAppDemoMode()) return "demo-wa-config-1";
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("configId");
  if (fromUrl && fromUrl !== "demo-wa-config-1") {
    try {
      localStorage.setItem(CONFIG_KEY, fromUrl);
    } catch {
      /* ignore */
    }
    return fromUrl;
  }
  try {
    const stored = localStorage.getItem(CONFIG_KEY) || "";
    return stored === "demo-wa-config-1" ? "" : stored;
  } catch {
    return "";
  }
}

export function setWhatsAppConfigId(id) {
  if (getWhatsAppDemoMode()) return;
  if (typeof window === "undefined") return;
  try {
    if (id) localStorage.setItem(CONFIG_KEY, id);
    else localStorage.removeItem(CONFIG_KEY);
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("configId", id);
  else url.searchParams.delete("configId");
  window.history.replaceState({}, "", url.pathname + url.search);
}

async function withConfigId(fn) {
  if (getWhatsAppDemoMode()) return fn("demo-wa-config-1");
  const configId = getWhatsAppConfigId();
  if (!configId) {
    const { accounts } = await listWhatsAppAccounts();
    if (accounts?.[0]?.id) {
      setWhatsAppConfigId(accounts[0].id);
      return fn(accounts[0].id);
    }
    throw new Error("No WhatsApp number configured. Add one in settings.");
  }
  return fn(configId);
}

function authFetch(path, options = {}) {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001/api";
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(`${API_BASE}${path}`, { ...options, headers }).then(async (res) => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || `Request failed (${res.status})`);
    }
    return res.json();
  });
}

const liveApi = {
  status() {
    return withConfigId((configId) => getWhatsAppStatus(configId));
  },
  saveConfig(payload) {
    return withConfigId((configId) => saveWhatsAppConfig(configId, payload));
  },
  validate() {
    return withConfigId((configId) => validateWhatsAppConfig(configId));
  },
  setEnabled(enabled) {
    return withConfigId((configId) => setWhatsAppEnabled(configId, enabled));
  },
  templates() {
    return withConfigId(async (configId) => {
      const data = await listWhatsAppTemplates(configId);
      return data.templates || [];
    });
  },
  activity(limit = 50) {
    return withConfigId((configId) =>
      authFetch(`/whatsapp/activity?configId=${encodeURIComponent(configId)}&limit=${limit}`).then(
        (d) => d.activity || [],
      ),
    );
  },
  usageBilling() {
    return withConfigId((configId) => getWhatsAppUsage(configId));
  },
  conversations(params = {}) {
    return withConfigId(async (configId) => {
      const data = await listWhatsAppConversations(configId, params);
      return data.conversations || [];
    });
  },
  conversationFilterCounts() {
    return withConfigId((configId) =>
      authFetch(`/whatsapp/conversations/counts?configId=${encodeURIComponent(configId)}`),
    );
  },
  conversation(id) {
    return withConfigId((configId) =>
      authFetch(`/whatsapp/conversations/${encodeURIComponent(id)}?configId=${encodeURIComponent(configId)}`),
    );
  },
  messages(id, params = {}) {
    return withConfigId(async (configId) => {
      const limit = params.limit || 100;
      const data = await listWhatsAppMessages(configId, id, limit);
      return data.messages || [];
    });
  },
  markRead(id) {
    return withConfigId((configId) => markWhatsAppConversationRead(configId, id));
  },
  syncConversation(id) {
    return withConfigId(async (configId) => {
      const conversation = await authFetch(
        `/whatsapp/conversations/${encodeURIComponent(id)}?configId=${encodeURIComponent(configId)}`,
      );
      const messages = await listWhatsAppMessages(configId, id, 200);
      return {
        conversation,
        messages: messages.messages || [],
        canSendFreeform: conversation.withinCustomerCareWindow,
      };
    });
  },
  setConversationFavorite(id, isFavorite) {
    return withConfigId((configId) =>
      authFetch(`/whatsapp/conversations/${encodeURIComponent(id)}/favorite?configId=${encodeURIComponent(configId)}`, {
        method: "PUT",
        body: JSON.stringify({ isFavorite: Boolean(isFavorite) }),
      }),
    );
  },
  openPhone(phone, displayName) {
    return withConfigId((configId) => openWhatsAppPhone(configId, phone, displayName));
  },
  downloadPhoneTemplate() {
    return downloadWhatsAppPhoneTemplate();
  },
  previewPhoneImport(file) {
    return previewWhatsAppPhoneImport(file);
  },
  syncFromMeta() {
    return withConfigId((configId) => syncWhatsAppFromMeta(configId));
  },
  importWebhookDump(file) {
    return withConfigId((configId) => importWhatsAppWebhookDump(configId, file));
  },
  openLead() {
    return Promise.reject(new Error("Leads are not linked in QSC."));
  },
  sendText(payload) {
    return withConfigId((configId) => sendWhatsAppText(configId, payload));
  },
  sendTemplate(payload) {
    return withConfigId((configId) => sendWhatsAppTemplate(configId, payload));
  },
  sendMedia(payload) {
    return withConfigId((configId) =>
      sendWhatsAppMedia(configId, {
        conversationId: payload.conversationId,
        phone: payload.phone,
        file: payload.file,
        caption: payload.caption,
        asVoice: payload.asVoice,
      }),
    );
  },
  async mediaBlobUrl(mediaPath) {
    if (!mediaPath) return null;
    const configId = getWhatsAppConfigId();
    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001/api";
    let path = mediaPath.startsWith("/") ? mediaPath : `/${mediaPath}`;
    if (path.startsWith("/meta-whatsapp/")) {
      path = path.replace("/meta-whatsapp/", "/whatsapp/");
    }
    if (!path.startsWith("/api/")) {
      path = path.startsWith("/whatsapp/") ? `/api${path}` : `${API_BASE}${path}`;
    } else if (!path.startsWith(API_BASE)) {
      path = `${API_BASE.replace(/\/api$/, "")}${path}`;
    }
    const sep = path.includes("?") ? "&" : "?";
    const url = `${path}${sep}configId=${encodeURIComponent(configId)}`;
    const token = getToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    return URL.createObjectURL(await res.blob());
  },
  listQuickReplies() {
    return withConfigId(async (configId) => {
      const data = await listWhatsAppQuickReplies(configId);
      return data.replies || [];
    });
  },
  createQuickReply(payload) {
    return withConfigId((configId) => createWhatsAppQuickReply(configId, payload));
  },
  updateQuickReply(id, payload) {
    return withConfigId((configId) => updateWhatsAppQuickReply(configId, id, payload));
  },
  deleteQuickReply(id) {
    return withConfigId((configId) => deleteWhatsAppQuickReply(configId, id));
  },
  translate() {
    return Promise.reject(new Error("Message translation is not enabled in QSC."));
  },
  createTemplate(payload) {
    return withConfigId((configId) => createWhatsAppTemplate(configId, payload));
  },
  updateTemplate(id, payload) {
    return withConfigId((configId) => updateWhatsAppTemplate(configId, id, payload));
  },
  deleteTemplate(payload) {
    return withConfigId((configId) =>
      deleteWhatsAppTemplate(configId, { name: payload.name, hsmId: payload.hsmId }),
    );
  },
  seedTemplates() {
    return Promise.resolve({ templates: [], note: "QSC does not ship prebuilt templates. Create one or add from Meta library." });
  },
  submitSeedTemplates() {
    return Promise.reject(new Error("Prebuilt template packs are not available. Create a template or add one from Meta library."));
  },
  cloneTemplates() {
    return Promise.reject(new Error("Template clone packs are not available in QSC."));
  },
  templateLibrary(params = {}) {
    return withConfigId(async (configId) => {
      const data = await listWhatsAppTemplateLibrary(configId, params);
      const templates = data.templates || data.data || [];
      return { templates, data: templates, verification: [] };
    });
  },
  createFromLibrary(payload) {
    return withConfigId((configId) => createWhatsAppTemplateFromLibrary(configId, payload));
  },
  uploadTemplateHeader(file) {
    return withConfigId((configId) => uploadWhatsAppTemplateHeader(configId, file));
  },
  startBulk() {
    return Promise.reject(new Error("Bulk send is not available in QSC."));
  },
  checkBulkPhones() {
    return Promise.resolve({ results: [] });
  },
  listBulk() {
    return Promise.resolve([]);
  },
  getBulk() {
    return Promise.reject(new Error("Bulk send is not available in QSC."));
  },
  cancelBulk() {
    return Promise.reject(new Error("Bulk send is not available in QSC."));
  },
  listAccounts: listWhatsAppAccounts,
  createAccount: createWhatsAppAccount,
  deleteAccount: deleteWhatsAppAccount,
  getConfigId: getWhatsAppConfigId,
  setConfigId: setWhatsAppConfigId,
};

export const metaWhatsAppApi = new Proxy(liveApi, {
  get(target, prop) {
    if (getWhatsAppDemoMode()) {
      const demo = demoApi();
      if (prop in demo && typeof demo[prop] === "function") {
        return demo[prop].bind(demo);
      }
      if (prop in demo) return demo[prop];
    }
    const val = target[prop];
    return typeof val === "function" ? val.bind(target) : val;
  },
});

export function notifyMetaWhatsAppUnreadChanged() {
  /* noop in QSC */
}
