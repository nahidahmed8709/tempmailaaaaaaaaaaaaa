/**
 * Global Browser Automation Bridge
 * Exposes window.TempMailAutomation for Chrome extensions, Tampermonkey scripts,
 * Playwright, Puppeteer, and Selenium.
 */

import { MailMessageDetail, MailMessageSummary } from '../services/mailApi';

export interface AutomationBridgeState {
  currentEmail: string;
  latestOtp: string | null;
  latestOtpMetadata: {
    code: string;
    service: string;
    timestamp: string;
    context?: string;
  } | null;
  inboxCount: number;
  isPolling: boolean;
  copyOtpToClipboard: () => Promise<boolean>;
  copyEmailToClipboard: () => Promise<boolean>;
  refreshInbox: () => Promise<void>;
  generateNewEmail: (prefix?: string) => Promise<string>;
  messages: MailMessageSummary[];
  activeMessage: MailMessageDetail | null;
}

declare global {
  interface Window {
    TempMailAutomation?: {
      version: string;
      getEmail: () => string;
      getLatestOTP: () => string | null;
      getLatestOTPMetadata: () => AutomationBridgeState['latestOtpMetadata'];
      copyOTP: () => Promise<boolean>;
      copyEmail: () => Promise<boolean>;
      refreshInbox: () => Promise<void>;
      generateNewEmail: (prefix?: string) => Promise<string>;
      getMessages: () => MailMessageSummary[];
      onOTP: (callback: (code: string, meta: any) => void) => () => void;
      onMessage: (callback: (msg: MailMessageSummary) => void) => () => void;
      // Selector guide for DOM automation
      selectors: {
        activeEmail: string;
        copyEmailBtn: string;
        latestOtp: string;
        copyOtpBtn: string;
        inboxCount: string;
        refreshBtn: string;
        newEmailBtn: string;
        messageRows: string;
      };
    };
  }
}

export const AUTOMATION_SELECTORS = {
  activeEmail: '#active-email',
  copyEmailBtn: '#copy-email-btn',
  latestOtp: '#latest-otp',
  copyOtpBtn: '#copy-otp-btn',
  inboxCount: '#inbox-count',
  refreshBtn: '#refresh-btn',
  newEmailBtn: '#new-email-btn',
  messageRows: '[data-automation="message-row"]',
  otpBadge: '[data-automation="otp-badge"]',
};

const otpListeners = new Set<(code: string, meta: any) => void>();
const msgListeners = new Set<(msg: MailMessageSummary) => void>();

export function setupAutomationBridge(getState: () => AutomationBridgeState) {
  if (typeof window === 'undefined') return;

  window.TempMailAutomation = {
    version: '1.0.0',
    getEmail: () => getState().currentEmail,
    getLatestOTP: () => getState().latestOtp,
    getLatestOTPMetadata: () => getState().latestOtpMetadata,
    copyOTP: () => getState().copyOtpToClipboard(),
    copyEmail: () => getState().copyEmailToClipboard(),
    refreshInbox: () => getState().refreshInbox(),
    generateNewEmail: (prefix?: string) => getState().generateNewEmail(prefix),
    getMessages: () => getState().messages,
    onOTP: (callback) => {
      otpListeners.add(callback);
      return () => {
        otpListeners.delete(callback);
      };
    },
    onMessage: (callback) => {
      msgListeners.add(callback);
      return () => {
        msgListeners.delete(callback);
      };
    },
    selectors: AUTOMATION_SELECTORS,
  };
}

export function notifyAutomationNewOTP(code: string, meta: { service: string; timestamp: string; context?: string }) {
  if (typeof window === 'undefined') return;

  // 1. Notify registered JS callbacks
  otpListeners.forEach(listener => {
    try {
      listener(code, meta);
    } catch (e) {
      console.error('Automation listener error:', e);
    }
  });

  // 2. Dispatch custom DOM event for content scripts
  window.dispatchEvent(
    new CustomEvent('tempmail:otp', {
      detail: { code, ...meta },
    })
  );
}

export function notifyAutomationNewMessage(message: MailMessageSummary) {
  if (typeof window === 'undefined') return;

  msgListeners.forEach(listener => {
    try {
      listener(message);
    } catch (e) {
      console.error('Message listener error:', e);
    }
  });

  window.dispatchEvent(
    new CustomEvent('tempmail:message', {
      detail: message,
    })
  );
}

export function notifyAutomationEmailChanged(email: string) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('tempmail:email-changed', {
      detail: { email },
    })
  );
}
