import React, { useState } from 'react';
import { MailMessageDetail } from '../services/mailApi';
import { safeWriteClipboard } from '../utils/clipboard';
import { KeyRound, Copy, Check, Trash2, FileText, Code, Eye, Download, Mail, ArrowUpRight } from 'lucide-react';

interface EmailViewerProps {
  message: MailMessageDetail | null;
  isLoading: boolean;
  onDelete: (id: string) => void;
  onCopyOtp: (otp: string) => Promise<boolean>;
  onTriggerSimulator: () => void;
}

export const EmailViewer: React.FC<EmailViewerProps> = ({
  message,
  isLoading,
  onDelete,
  onCopyOtp,
  onTriggerSimulator,
}) => {
  const [viewTab, setViewTab] = useState<'html' | 'text' | 'raw'>('html');
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  if (isLoading) {
    return (
      <div className="h-full bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-medium text-slate-400">Loading email contents...</p>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="h-full bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
          <Mail className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-base font-bold text-slate-200">No message selected</h3>
        <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
          Select an incoming email from the inbox list on the left to inspect its contents and extract verification tokens.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onTriggerSimulator}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <span>Send Test Verification Email</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const handleCopyOtp = async () => {
    if (!message.detectedOtp) return;
    const ok = await onCopyOtp(message.detectedOtp);
    if (ok) {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  const handleCopyBody = async () => {
    const text = message.text || (message.html && message.html[0]) || '';
    const ok = await safeWriteClipboard(text);
    if (ok) {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  const handleDownloadEml = () => {
    const content = `From: ${message.from.name} <${message.from.address}>\nTo: ${message.to.map(t => t.address).join(', ')}\nSubject: ${message.subject}\nDate: ${message.createdAt}\nContent-Type: text/html; charset=utf-8\n\n${message.html?.[0] || message.text || ''}`;
    const blob = new Blob([content], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_${message.id}.eml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Top Header / Meta Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-snug break-words">
            {message.subject || '(No subject)'}
          </h1>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyBody}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Copy email body to clipboard"
            >
              {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBody ? 'Copied Body' : 'Copy Body'}</span>
            </button>

            <button
              onClick={handleDownloadEml}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Download .eml file"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDelete(message.id)}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
              title="Delete email"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sender details and timestamp */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">{message.from?.name || 'Sender'}</span>
            <span className="text-slate-500 font-mono text-[11px]">&lt;{message.from?.address}&gt;</span>
          </div>

          <div className="text-[11px] font-mono tabular-nums text-slate-400">
            {new Date(message.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Dedicated OTP Callout inside this message if detected */}
        {message.detectedOtp && (
          <div className="mt-4 bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-600/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
                  Verification Code Detected
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    id="message-otp-code"
                    data-automation="message-otp-code"
                    className="font-mono text-2xl font-black text-white tracking-widest bg-slate-950 px-3 py-0.5 rounded border border-indigo-500/50 select-all"
                  >
                    {message.detectedOtp}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    #message-otp-code
                  </span>
                </div>
              </div>
            </div>

            <button
              id="message-otp-copy-btn"
              data-automation="message-copy-otp"
              onClick={handleCopyOtp}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 whitespace-nowrap ${
                copiedOtp
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
              }`}
            >
              {copiedOtp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedOtp ? 'Copied to Clipboard!' : 'Copy OTP Only'}</span>
            </button>
          </div>
        )}
      </div>

      {/* View Format Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg text-xs">
          <button
            onClick={() => setViewTab('html')}
            className={`px-3 py-1 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              viewTab === 'html'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>HTML Preview</span>
          </button>

          <button
            onClick={() => setViewTab('text')}
            className={`px-3 py-1 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              viewTab === 'text'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plain Text</span>
          </button>

          <button
            onClick={() => setViewTab('raw')}
            className={`px-3 py-1 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              viewTab === 'raw'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw Data</span>
          </button>
        </div>
      </div>

      {/* Email Body Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/20">
        {viewTab === 'html' && message.html && message.html.length > 0 ? (
          <div className="w-full bg-white text-slate-900 rounded-lg overflow-hidden shadow-sm border border-slate-700/50">
            <iframe
              title="Email HTML Preview"
              srcDoc={message.html[0]}
              sandbox="allow-same-origin allow-popups"
              className="w-full min-h-[460px] border-none"
            />
          </div>
        ) : viewTab === 'text' || (!message.html || message.html.length === 0) ? (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {message.text || 'No text content available.'}
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-400 overflow-x-auto">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(
                {
                  id: message.id,
                  msgid: message.msgid,
                  from: message.from,
                  to: message.to,
                  subject: message.subject,
                  createdAt: message.createdAt,
                  detectedOtp: message.detectedOtp,
                  hasAttachments: message.hasAttachments,
                  size: message.size,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
