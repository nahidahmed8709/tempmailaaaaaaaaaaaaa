import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Edit3, QrCode, Trash2, ShieldCheck, ChevronDown, Server, Play } from 'lucide-react';
import { MailProvider } from '../services/mailApi';

interface ActiveEmailBarProps {
  currentEmail: string;
  currentProvider: 'guerrilla' | 'tempmaillol' | 'mailtm';
  providers: MailProvider[];
  onChangeProvider: (provider: 'guerrilla' | 'tempmaillol' | 'mailtm') => void;
  onCopyEmail: () => Promise<boolean>;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
  nextRefreshSec: number;
  onOpenCustomModal: () => void;
  onDeleteInbox: () => void;
  availableDomains: string[];
  selectedDomain: string;
  onSelectDomain: (domain: string) => void;
  onTriggerSimulator: () => void;
}

export const ActiveEmailBar: React.FC<ActiveEmailBarProps> = ({
  currentEmail,
  currentProvider,
  providers,
  onChangeProvider,
  onCopyEmail,
  isRefreshing,
  onRefresh,
  nextRefreshSec,
  onOpenCustomModal,
  onDeleteInbox,
  availableDomains,
  selectedDomain,
  onSelectDomain,
  onTriggerSimulator,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  const handleCopy = async () => {
    const success = await onCopyEmail();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeProviderObj = providers.find((p) => p.id === currentProvider) || providers[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg shadow-black/40">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Email address display and primary copy */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs font-medium text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200 font-semibold">Active Temp Inbox</span>
            <span aria-hidden="true">·</span>
            {/* Provider indicator badge */}
            <div className="relative inline-block">
              <button
                onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-300 hover:text-white bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded transition-colors"
                title="Click to switch mail server network"
              >
                <Server className="w-3 h-3 text-indigo-400" />
                <span>{activeProviderObj?.name || 'Guerrilla Mail'}</span>
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </button>

              {showProviderDropdown && (
                <div className="absolute left-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-30 py-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Mail Network Provider
                  </div>
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onChangeProvider(p.id as any);
                        setShowProviderDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex flex-col ${
                        currentProvider === p.id
                          ? 'bg-indigo-950/40 text-indigo-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{p.name}</span>
                        {currentProvider === p.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{p.badge}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="text-emerald-400 font-mono text-[11px] hidden sm:inline">
              Real-Time MX Active
            </span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* The main email DOM node for extensions */}
            <div
              className="flex-1 min-w-[260px] bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 flex items-center justify-between group hover:border-slate-600 transition-colors"
              title={currentEmail ? 'Click to copy email address' : 'Provisioning your temporary address'}
            >
              <span
                id="active-email"
                data-automation="email-address"
                className="font-mono text-sm sm:text-base font-bold text-slate-100 tracking-tight select-all truncate"
              >
                {currentEmail ? (
                  currentEmail
                ) : (
                  <span className="flex items-center gap-2 text-indigo-400 font-normal text-xs sm:text-sm">
                    <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>Provisioning temporary address...</span>
                  </span>
                )}
              </span>

              <span className="text-[11px] font-mono text-slate-500 hidden sm:inline ml-2 shrink-0">
                #active-email
              </span>
            </div>

            {/* Dedicated Copy Email Button */}
            <button
              id="copy-email-btn"
              data-automation="copy-email"
              onClick={handleCopy}
              disabled={!currentEmail}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                !currentEmail
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : copied
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-sm shadow-indigo-600/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Email'}</span>
            </button>
          </div>
        </div>

        {/* Right: Actions, Domain selector, and Refresh timer */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t border-slate-800/80 lg:border-t-0">
          {/* Quick "Test OTP" Simulation Button */}
          <button
            onClick={onTriggerSimulator}
            className="px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/40 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            title="Inject simulated OTP to test copy and detection"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test OTP</span>
          </button>

          {/* Domain Dropdown */}
          {availableDomains.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowDomainDropdown(!showDomainDropdown)}
                className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <span className="font-mono truncate max-w-[130px]">@{selectedDomain}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showDomainDropdown && (
                <div className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-30 py-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Domain
                  </div>
                  {availableDomains.map((dom) => (
                    <button
                      key={dom}
                      onClick={() => {
                        onSelectDomain(dom);
                        setShowDomainDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors flex items-center justify-between ${
                        selectedDomain === dom
                          ? 'text-indigo-400 bg-indigo-950/40 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>@{dom}</span>
                      {selectedDomain === dom && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Username Button */}
          <button
            onClick={onOpenCustomModal}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5"
            title="Create custom username alias"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Custom Alias</span>
          </button>

          {/* QR Code Toggle */}
          <button
            onClick={() => setShowQr(!showQr)}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5"
            title="Show QR Code for mobile"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">QR</span>
          </button>

          {/* Manual Refresh Button with Countdown */}
          <button
            id="refresh-btn"
            data-automation="refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 active:scale-95 transition-all flex items-center gap-2 group"
            title="Check for new mail now"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-indigo-400 ${
                isRefreshing ? 'animate-spin text-indigo-300' : 'group-hover:rotate-180 transition-transform duration-500'
              }`}
            />
            <span className="font-mono tabular-nums text-slate-400 text-[11px]">
              {isRefreshing ? 'Checking...' : `${nextRefreshSec}s`}
            </span>
          </button>

          {/* Delete Inbox */}
          <button
            onClick={onDeleteInbox}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg border border-transparent hover:border-red-900/50 transition-colors"
            title="Delete current inbox and start fresh"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QR Code Modal Overlay if opened */}
      {showQr && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                  currentEmail
                )}`}
                alt="QR Code"
                className="w-24 h-24"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Scan to copy address on phone</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                Open your camera app to copy this temp email directly to your mobile clipboard.
              </p>
              <button
                onClick={() => setShowQr(false)}
                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline"
              >
                Close QR preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
