import type { WhatsAppAccountStatus } from "@/lib/api";

export function getWhatsAppConfigId(): string;
export function setWhatsAppConfigId(id: string): void;
export function isWhatsAppDemoToggleVisible(): boolean;
export function getWhatsAppDemoMode(): boolean;
export function setWhatsAppDemoMode(on: boolean): void;
export function notifyMetaWhatsAppUnreadChanged(): void;

export const metaWhatsAppApi: {
  listAccounts(): Promise<{ accounts: WhatsAppAccountStatus[] }>;
  createAccount(label: string): Promise<WhatsAppAccountStatus>;
  status(): Promise<WhatsAppAccountStatus>;
  saveConfig(payload: Record<string, unknown>): Promise<WhatsAppAccountStatus>;
  validate(): Promise<WhatsAppAccountStatus>;
  setEnabled(enabled: boolean): Promise<WhatsAppAccountStatus>;
  templates(): Promise<unknown[]>;
  conversations(params?: Record<string, unknown>): Promise<unknown[]>;
  conversationFilterCounts(): Promise<Record<string, number>>;
  conversation(id: string): Promise<unknown>;
  messages(id: string, params?: Record<string, unknown>): Promise<unknown[]>;
  markRead(id: string): Promise<unknown>;
  syncConversation(id: string): Promise<unknown>;
  syncFromMeta(): Promise<unknown>;
  importWebhookDump(file: File): Promise<unknown>;
  setConversationFavorite(id: string, isFavorite: boolean): Promise<unknown>;
  openPhone(phone: string, displayName?: string): Promise<unknown>;
  sendText(payload: Record<string, unknown>): Promise<unknown>;
  sendTemplate(payload: Record<string, unknown>): Promise<unknown>;
  activity(limit?: number): Promise<unknown[]>;
  mediaBlobUrl(mediaPath: string | null): Promise<string | null>;
  [key: string]: unknown;
};
