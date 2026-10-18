import React, { useState } from 'react';
import { Play, Sparkles, KeyRound, Check } from 'lucide-react';

interface TestEmailModalProps {
  currentEmail: string;
  onSendMock: (service: 'Google' | 'GitHub' | 'Discord' | 'Steam' | 'Stripe' | 'Custom', customCode?: string) => void;
  onClose: () => void;
}

export const TestEmailModal: React.FC<TestEmailModalProps> = ({
  currentEmail,
  onSendMock,
  onClose,
}) => {
  const [selectedService, setSelectedService] = useState<'Google' | 'GitHub' | 'Discord' | 'Steam' | 'Stripe' | 'Custom'>('Google');
  const [customOtp, setCustomOtp] = useState('749201');
  const [sentSuccess, setSentSuccess] = useState(false);

  const presets = [
    { id: 'Google', label: 'Google 2FA', sample: '6 digits (e.g. 849201)' },
    { id: 'GitHub', label: 'GitHub Device', sample: '6 digits (e.g. 592018)' },
    { id: 'Discord', label: 'Discord Code', sample: '6 digits (e.g. 301928)' },
    { id: 'Steam', label: 'Steam Guard', sample: '5 alphanumeric (e.g. R9K2M)' },
    { id: 'Stripe', label: 'Stripe Auth', sample: '6 digits (e.g. 481920)' },
    { id: 'Custom', label: 'Custom Token', sample: 'Define your own code' },
  ] as const;

  const handleSend = () => {
    onSendMock(selectedService, selectedService === 'Custom' ? customOtp : undefined);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Test Verification Simulator</h2>
              <p className="text-xs text-slate-400">
                Instantly simulate an incoming OTP email to test your extension or script.
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Select Preset Service
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedService(preset.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedService === preset.id
                      ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{preset.label}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{preset.sample}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedService === 'Custom' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Custom Verification Token / OTP
              </label>
              <input
                type="text"
                value={customOtp}
                onChange={(e) => setCustomOtp(e.target.value)}
                placeholder="e.g. 982103 or MYAPP-7429"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Delivery destination:</span>
            <span className="font-mono text-indigo-300 block mt-0.5 truncate">{currentEmail}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>

          <button
            onClick={handleSend}
            disabled={sentSuccess}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
              sentSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
            }`}
          >
            {sentSuccess ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{sentSuccess ? 'Injected Into Inbox!' : 'Send Test OTP Email'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
