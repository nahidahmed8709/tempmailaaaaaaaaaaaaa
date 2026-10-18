import React, { useState } from 'react';
import { MailMessageSummary } from '../services/mailApi';
import { Search, Mail, Inbox, Copy, Check, Trash2, KeyRound } from 'lucide-react';

interface EmailListProps {
  messages: MailMessageSummary[];
  selectedMessageId: string | null;
  onSelectMessage: (id: string) => void;
  onDeleteMessage: (id: string, e: React.MouseEvent) => void;
  onCopyOtpDirect: (otp: string, e: React.MouseEvent) => void;
}

export const EmailList: React.FC<EmailListProps> = ({
  messages,
  selectedMessageId,
  onSelectMessage,
  onDeleteMessage,
  onCopyOtpDirect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);

  const filteredMessages = messages.filter((msg) => {
    const term = searchTerm.toLowerCase();
    const sender = (msg.from?.name || msg.from?.address || '').toLowerCase();
    const subject = (msg.subject || '').toLowerCase();
    const otp = (msg.detectedOtp || '').toLowerCase();
    return sender.includes(term) || subject.includes(term) || otp.includes(term);
  });

  const handleCopyOtp = (id: string, otp: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyOtpDirect(otp, e);
    setCopiedOtpId(id);
    setTimeout(() => setCopiedOtpId(null), 1500);
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Header with Search */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Inbox
            </h2>
          </div>
          <span
            id="inbox-count"
            data-automation="inbox-count"
            className="text-xs font-mono tabular-nums bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700"
          >
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search emails or OTP codes..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Message list container */}
      <div
        id="message-list"
        data-automation="message-list"
        className="flex-1 overflow-y-auto divide-y divide-slate-800/60"
      >
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Mail className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
            <p className="text-xs font-medium text-slate-400">
              {messages.length === 0 ? 'No emails received yet' : 'No matching messages'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
              {messages.length === 0
                ? 'Send a verification email to your temporary address or click "Test Simulator" to test.'
                : 'Try adjusting your search terms.'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isSelected = selectedMessageId === msg.id;
            const senderName = msg.from?.name || msg.from?.address?.split('@')[0] || 'Unknown';
            const firstLetter = (senderName[0] || 'M').toUpperCase();

            return (
              <div
                key={msg.id}
                data-automation="message-row"
                data-message-id={msg.id}
                onClick={() => onSelectMessage(msg.id)}
                className={`p-3.5 cursor-pointer transition-colors group relative ${
                  isSelected
                    ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Sender Info & Avatar */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                      {firstLetter}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-200 truncate block">
                        {senderName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono truncate block">
                        {msg.from?.address}
                      </span>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
                    {formatTimestamp(msg.createdAt)}
                  </span>
                </div>

                {/* Subject */}
                <h3 className="text-xs font-medium text-slate-300 mt-2 truncate group-hover:text-white transition-colors">
                  {msg.subject || '(No subject)'}
                </h3>

                {/* OTP Quick Copy Row Feature */}
                {msg.detectedOtp && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 bg-slate-950/80 border border-indigo-900/50 rounded-lg p-1.5 px-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-[11px] text-slate-400">OTP:</span>
                      <span
                        data-automation="row-otp-code"
                        className="font-mono text-xs font-bold text-indigo-300 tracking-wider"
                      >
                        {msg.detectedOtp}
                      </span>
                    </div>

                    <button
                      data-automation="copy-row-otp"
                      onClick={(e) => handleCopyOtp(msg.id, msg.detectedOtp!, e)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all shrink-0 ${
                        copiedOtpId === msg.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white'
                      }`}
                      title="Copy this OTP directly"
                    >
                      {copiedOtpId === msg.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy OTP</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Intro preview text if no OTP */}
                {!msg.detectedOtp && msg.intro && (
                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                    {msg.intro}
                  </p>
                )}

                {/* Delete row action button */}
                <button
                  onClick={(e) => onDeleteMessage(msg.id, e)}
                  className="absolute right-2 top-2 p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
