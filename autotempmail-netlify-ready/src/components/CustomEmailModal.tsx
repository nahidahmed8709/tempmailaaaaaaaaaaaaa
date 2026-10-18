import React, { useState } from 'react';
import { Edit3, Check, Sparkles } from 'lucide-react';

interface CustomEmailModalProps {
  availableDomains: string[];
  selectedDomain: string;
  onGenerate: (username: string, domain: string) => Promise<void>;
  onClose: () => void;
}

export const CustomEmailModal: React.FC<CustomEmailModalProps> = ({
  availableDomains,
  selectedDomain,
  onGenerate,
  onClose,
}) => {
  const [prefix, setPrefix] = useState('');
  const [domain, setDomain] = useState(selectedDomain || (availableDomains[0] || 'maxxspace.com'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = prefix.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (!clean) {
      setError('Please provide a valid username (letters, numbers, underscores).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onGenerate(clean, domain);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create custom email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create Custom Inbox</h2>
              <p className="text-xs text-slate-400">Choose your custom username alias and domain.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Username Prefix
            </label>
            <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 focus-within:border-indigo-500 overflow-hidden">
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="mybot_test"
                autoFocus
                className="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-white focus:outline-none"
              />
              <span className="px-3 text-xs font-mono text-slate-500 select-none border-l border-slate-800">
                @{domain}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Domain
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            >
              {availableDomains.map((d) => (
                <option key={d} value={d}>
                  @{d}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-lg">
              {error}
            </p>
          )}

          <div className="p-4 border-t border-slate-800 bg-slate-950/80 -mx-6 -mb-6 mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Creating...' : 'Create Inbox'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
