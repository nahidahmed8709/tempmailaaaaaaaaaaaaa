import React, { useState } from 'react';
import { Terminal, Copy, Check, Code2, Play, CheckCircle2, AlertCircle, FileCode } from 'lucide-react';
import { AUTOMATION_SELECTORS } from '../utils/automationBridge';
import { safeWriteClipboard } from '../utils/clipboard';

interface AutomationHelperModalProps {
  currentEmail: string;
  latestOtp: string | null;
  onClose: () => void;
}

export const AutomationHelperModal: React.FC<AutomationHelperModalProps> = ({
  currentEmail,
  latestOtp,
  onClose,
}) => {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'chrome' | 'userscript' | 'python' | 'puppeteer'>('chrome');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const snippets = {
    chrome: `// content.js - Chrome Extension Content Script
// 1. Get current temp email
const email = document.querySelector('${AUTOMATION_SELECTORS.activeEmail}')?.innerText;
console.log('Detected Temp Email:', email);

// 2. Click the dedicated "Copy OTP" button automatically
function copyOtpViaButton() {
  const copyBtn = document.querySelector('${AUTOMATION_SELECTORS.copyOtpBtn}');
  if (copyBtn && !copyBtn.disabled) {
    copyBtn.click();
    console.log('Triggered Copy OTP Button');
  }
}

// 3. Or read the detected OTP directly from DOM
function getLatestOtp() {
  const otpElem = document.querySelector('${AUTOMATION_SELECTORS.latestOtp}');
  const code = otpElem?.innerText?.trim();
  // Filter out waiting placeholder text
  if (code && /^\\d{4,8}$/.test(code)) {
    return code;
  }
  return null;
}

// 4. Or listen for instant CustomEvent dispatched by AutoTempMail
window.addEventListener('tempmail:otp', (event) => {
  const { code, service } = event.detail;
  console.log('Received OTP from AutoTempMail:', code, 'Service:', service);
  
  // Forward OTP to your extension background worker
  chrome.runtime?.sendMessage?.({ type: 'OTP_DETECTED', code, service });
});`,

    userscript: `// ==UserScript==
// @name         AutoTempMail OTP Forwarder
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automates email extraction and OTP copying
// @match        *://*/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
  'use strict';

  // Listen for real-time OTP events
  window.addEventListener('tempmail:otp', (e) => {
    const { code, service } = e.detail;
    console.log('[Userscript] OTP arrived:', code, 'from', service);
    
    // Copy code to system clipboard
    if (typeof GM_setClipboard !== 'undefined') {
      GM_setClipboard(code);
    }
  });

  // Query global automation object if available
  if (window.TempMailAutomation) {
    console.log('[Userscript] Connected to TempMailAutomation API v' + window.TempMailAutomation.version);
    window.TempMailAutomation.onOTP((code) => {
      console.log('[Userscript] Callback OTP:', code);
    });
  }
})();`,

    python: `# Python + Playwright automation example
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # 1. Wait for and extract active temp email
    page.wait_for_selector("#active-email")
    email = page.locator("#active-email").inner_text()
    print(f"Generated Temp Email: {email}")

    # Use 'email' in your target sign-up flow...
    # (Navigate to target website and submit registration form)

    # 2. Wait for incoming OTP detection on AutoTempMail
    print("Waiting for OTP...")
    # Wait until #copy-otp-btn is enabled or #latest-otp contains digits
    page.wait_for_selector("#latest-otp:not(:has-text('Waiting'))", timeout=60000)
    otp_code = page.locator("#latest-otp").inner_text()
    print(f"Auto-Detected OTP Code: {otp_code}")

    # Click the handy "Copy OTP" button
    page.locator("#copy-otp-btn").click()

    browser.close()`,

    puppeteer: `// Node.js Puppeteer Automation
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.goto('http://localhost:3000');

// 1. Get temporary email address
await page.waitForSelector('#active-email');
const email = await page.$eval('#active-email', el => el.innerText.trim());
console.log('Email to use for registration:', email);

// 2. Wait for OTP to be detected
await page.waitForFunction(() => {
  const el = document.querySelector('#latest-otp');
  return el && /^\\d{4,8}$/.test(el.innerText.trim());
}, { timeout: 60000 });

const otp = await page.$eval('#latest-otp', el => el.innerText.trim());
console.log('Extracted OTP:', otp);

// 3. Or trigger the copy button directly
await page.click('#copy-otp-btn');

await browser.close();`,
  };

  const handleCopySnippet = async () => {
    const ok = await safeWriteClipboard(snippets[activeSnippetTab]);
    if (ok) {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const testGlobalMethod = (method: 'getEmail' | 'getLatestOTP' | 'copyOTP') => {
    if (!window.TempMailAutomation) {
      setTestResult('window.TempMailAutomation is not registered yet.');
      return;
    }
    if (method === 'getEmail') {
      const res = window.TempMailAutomation.getEmail();
      setTestResult(`window.TempMailAutomation.getEmail() => "${res}"`);
    } else if (method === 'getLatestOTP') {
      const res = window.TempMailAutomation.getLatestOTP();
      setTestResult(`window.TempMailAutomation.getLatestOTP() => "${res || 'null (none detected yet)'}"`);
    } else if (method === 'copyOTP') {
      window.TempMailAutomation.copyOTP().then((ok) => {
        setTestResult(`window.TempMailAutomation.copyOTP() => ${ok ? 'true (Copied!)' : 'false (No OTP active)'}`);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Browser Extension Automation Helper</h2>
              <p className="text-xs text-slate-400">
                Machine-readable DOM selectors, global JavaScript API, and integration scripts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: DOM Selectors Audit */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Standardized DOM Selectors</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-semibold text-slate-200">Active Email Address</span>
                  <span className="text-emerald-400 font-mono text-[11px]">ACTIVE</span>
                </div>
                <code className="text-indigo-300 font-mono text-[11px] block bg-slate-900 p-1 rounded">
                  {AUTOMATION_SELECTORS.activeEmail}
                </code>
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  Current value: <strong className="text-slate-200">{currentEmail || 'None'}</strong>
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-semibold text-slate-200">Latest OTP Code</span>
                  <span className={`font-mono text-[11px] ${latestOtp ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {latestOtp ? 'OTP DETECTED' : 'WAITING'}
                  </span>
                </div>
                <code className="text-indigo-300 font-mono text-[11px] block bg-slate-900 p-1 rounded">
                  {AUTOMATION_SELECTORS.latestOtp}
                </code>
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  Current value: <strong className="text-slate-200">{latestOtp || '(Waiting for email)'}</strong>
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-semibold text-slate-200">"Only OTP Copy Button"</span>
                  <span className="text-emerald-400 font-mono text-[11px]">READY</span>
                </div>
                <code className="text-indigo-300 font-mono text-[11px] block bg-slate-900 p-1 rounded">
                  {AUTOMATION_SELECTORS.copyOtpBtn}
                </code>
                <p className="text-[11px] text-slate-400 mt-1">
                  Simulate click with <code>element.click()</code> to copy OTP to clipboard.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-semibold text-slate-200">Refresh Button</span>
                  <span className="text-emerald-400 font-mono text-[11px]">READY</span>
                </div>
                <code className="text-indigo-300 font-mono text-[11px] block bg-slate-900 p-1 rounded">
                  {AUTOMATION_SELECTORS.refreshBtn}
                </code>
                <p className="text-[11px] text-slate-400 mt-1">
                  Triggers an instant polling sync with Mail.tm.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Global window.TempMailAutomation API Interactive Tester */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>window.TempMailAutomation Live Tester</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Test invoking the exposed client API methods right now in this browser window:
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                onClick={() => testGlobalMethod('getEmail')}
                className="px-2.5 py-1.5 text-xs font-mono font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-slate-200 transition-colors"
              >
                .getEmail()
              </button>

              <button
                onClick={() => testGlobalMethod('getLatestOTP')}
                className="px-2.5 py-1.5 text-xs font-mono font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-slate-200 transition-colors"
              >
                .getLatestOTP()
              </button>

              <button
                onClick={() => testGlobalMethod('copyOTP')}
                className="px-2.5 py-1.5 text-xs font-mono font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-slate-200 transition-colors"
              >
                .copyOTP()
              </button>
            </div>

            {testResult && (
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400">
                {testResult}
              </div>
            )}
          </div>

          {/* Section 3: Ready-to-use Code Snippets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg text-xs">
                <button
                  onClick={() => setActiveSnippetTab('chrome')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors ${
                    activeSnippetTab === 'chrome' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Chrome Extension
                </button>
                <button
                  onClick={() => setActiveSnippetTab('userscript')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors ${
                    activeSnippetTab === 'userscript' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tampermonkey
                </button>
                <button
                  onClick={() => setActiveSnippetTab('python')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors ${
                    activeSnippetTab === 'python' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Python Playwright
                </button>
                <button
                  onClick={() => setActiveSnippetTab('puppeteer')}
                  className={`px-3 py-1 font-medium rounded-md transition-colors ${
                    activeSnippetTab === 'puppeteer' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Puppeteer
                </button>
              </div>

              <button
                onClick={handleCopySnippet}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied Snippet' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto">
              <pre className="font-mono text-xs text-slate-300 leading-relaxed">
                {snippets[activeSnippetTab]}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Helper
          </button>
        </div>
      </div>
    </div>
  );
};
