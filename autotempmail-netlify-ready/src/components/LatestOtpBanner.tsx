import React, { useState } from 'react';
import { KeyRound, Copy, Check, Volume2, VolumeX, Zap, Sparkles } from 'lucide-react';

interface LatestOtpBannerProps {
  latestOtp: string | null;
  otpMetadata: {
    code: string;
    service: string;
    timestamp: string;
    context?: string;
  } | null;
  onCopyOtp: () => Promise<boolean>;
  autoCopyEnabled: boolean;
  onToggleAutoCopy: (enabled: boolean) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
}

export const LatestOtpBanner: React.FC<LatestOtpBannerProps> = ({
  latestOtp,
  otpMetadata,
  onCopyOtp,
  autoCopyEnabled,
  onToggleAutoCopy,
  soundEnabled,
  onToggleSound,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!latestOtp) return;
    const success = await onCopyOtp();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id="latest-otp-container"
      data-automation="latest-otp-container"
      className={`rounded-xl border transition-all duration-300 ${
        latestOtp
          ? 'bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border-indigo-500/50 shadow-xl shadow-indigo-950/50 ring-1 ring-indigo-500/30'
          : 'bg-slate-900/60 border-slate-800/80'
      } p-4 sm:p-5`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: OTP Label & Code Display */}
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              latestOtp
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <KeyRound className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Auto-Detected OTP
              </span>
              {otpMetadata && (
                <>
                  <span className="text-slate-600 text-xs" aria-hidden="true">·</span>
                  <span className="text-xs font-medium text-slate-300">
                    {otpMetadata.service}
                  </span>
                </>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-3">
              {latestOtp ? (
                <div className="flex items-center gap-2">
                  <span
                    id="latest-otp"
                    data-automation="otp-code"
                    className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-widest bg-slate-950/80 px-3.5 py-1 rounded-lg border border-indigo-500/40 shadow-inner select-all"
                  >
                    {latestOtp}
                  </span>
                  <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                    #latest-otp
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    id="latest-otp"
                    data-automation="otp-code"
                    className="font-mono text-base text-slate-500 italic"
                  >
                    Waiting for incoming verification code...
                  </span>
                </div>
              )}
            </div>

            {otpMetadata?.context && (
              <p className="text-[11px] text-slate-400 mt-1 max-w-xl truncate">
                {otpMetadata.context}
              </p>
            )}
          </div>
        </div>

        {/* Right: The Dedicated "Only OTP Copy" Button & Quick Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick preference toggles */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-400">
            {/* Auto-copy toggle */}
            <label
              className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200 transition-colors select-none"
              title="Automatically copy OTP to clipboard whenever new verification code arrives"
            >
              <input
                type="checkbox"
                id="autocopy-toggle"
                data-automation="autocopy-toggle"
                checked={autoCopyEnabled}
                onChange={(e) => onToggleAutoCopy(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="flex items-center gap-1 font-medium text-[11px]">
                <Zap className="w-3 h-3 text-amber-400" />
                Auto-Copy
              </span>
            </label>

            <span className="text-slate-700" aria-hidden="true">|</span>

            {/* Sound chime toggle */}
            <button
              onClick={() => onToggleSound(!soundEnabled)}
              className="flex items-center gap-1 hover:text-slate-200 transition-colors text-[11px] select-none"
              title={soundEnabled ? 'Mute OTP sound alert' : 'Enable OTP sound alert'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Sound</span>
            </button>
          </div>

          {/* THE "ONLY OTP COPY BUTTON" */}
          <button
            id="copy-otp-btn"
            data-automation="copy-otp"
            onClick={handleCopy}
            disabled={!latestOtp}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 whitespace-nowrap min-w-[160px] ${
              !latestOtp
                ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : copied
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/40 ring-1 ring-indigo-400/50 hover:shadow-lg'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-white" />
                <span>Copied OTP!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copy OTP Only</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
