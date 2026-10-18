import React from 'react';
import { Mail, Sparkles, Terminal, Code2, Play } from 'lucide-react';

interface TopNavProps {
  activeTab: 'inbox' | 'automation' | 'simulator';
  setActiveTab: (tab: 'inbox' | 'automation' | 'simulator') => void;
  onNewEmailClick: () => void;
  inboxCount: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onNewEmailClick,
  inboxCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
          <Mail className="w-4 h-4" />
        </div>
        <a href="/" className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
          AutoTempMail
        </a>
        <span className="hidden sm:inline-block text-xs font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded">
          Extension-Ready
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'inbox'
              ? 'text-white font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <span>Inbox</span>
          {inboxCount > 0 && (
            <span
              id="nav-inbox-badge"
              className="text-xs font-mono bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-1.5 rounded-full"
            >
              {inboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('automation')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'automation'
              ? 'text-white font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Extension Helper</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === 'simulator'
              ? 'text-white font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <Play className="w-4 h-4 text-emerald-400" />
          <span>Test Simulator</span>
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onNewEmailClick}
          id="new-email-btn"
          data-automation="new-email"
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:scale-95 transition-all shadow-sm shadow-indigo-600/30 whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Inbox</span>
        </button>
      </div>
    </header>
  );
};
