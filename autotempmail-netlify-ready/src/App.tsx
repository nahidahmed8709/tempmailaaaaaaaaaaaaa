/**
 * AutoTempMail - Automation-Ready Temp Mail with Instant OTP Extraction
 * Powered by Guerrilla Mail (Universal Real-Mail Delivery), TempMail.lol, and Mail.tm.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchProviders,
  createInbox,
  fetchMessages,
  fetchMessageDetail,
  deleteMessage,
  createMockOTPMessage,
  MailAccount,
  MailMessageSummary,
  MailMessageDetail,
  MailProvider,
} from './services/mailApi';
import { extractOTP } from './utils/otpExtractor';
import { playOtpChime } from './utils/audioChime';
import { safeWriteClipboard } from './utils/clipboard';
import {
  setupAutomationBridge,
  notifyAutomationNewOTP,
  notifyAutomationNewMessage,
  notifyAutomationEmailChanged,
} from './utils/automationBridge';
import { TopNav } from './components/TopNav';
import { ActiveEmailBar } from './components/ActiveEmailBar';
import { LatestOtpBanner } from './components/LatestOtpBanner';
import { EmailList } from './components/EmailList';
import { EmailViewer } from './components/EmailViewer';
import { AutomationHelperModal } from './components/AutomationHelperModal';
import { TestEmailModal } from './components/TestEmailModal';
import { CustomEmailModal } from './components/CustomEmailModal';
import { Check, ExternalLink } from 'lucide-react';

const REFRESH_INTERVAL_SEC = 5;

export default function App() {
  const [providers, setProviders] = useState<MailProvider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<'guerrilla' | 'tempmaillol' | 'mailtm'>(() => {
    return (localStorage.getItem('autotempmail_provider') as any) || 'guerrilla';
  });

  const [account, setAccount] = useState<MailAccount | null>(() => {
    try {
      const saved = localStorage.getItem('autotempmail_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [availableDomains, setAvailableDomains] = useState<string[]>([
    'guerrillamailblock.com',
    'sharklasers.com',
    'guerrillamail.com',
    'grr.la',
    'pokemail.net',
  ]);
  const [selectedDomain, setSelectedDomain] = useState<string>('guerrillamailblock.com');

  const [messages, setMessages] = useState<MailMessageSummary[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedMessageDetail, setSelectedMessageDetail] = useState<MailMessageDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [latestOtp, setLatestOtp] = useState<string | null>(null);
  const [latestOtpMetadata, setLatestOtpMetadata] = useState<{
    code: string;
    service: string;
    timestamp: string;
    context?: string;
  } | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextRefreshSec, setNextRefreshSec] = useState(REFRESH_INTERVAL_SEC);

  const [autoCopyEnabled, setAutoCopyEnabled] = useState<boolean>(() => {
    return localStorage.getItem('autotempmail_autocopy') === 'true';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('autotempmail_sound') !== 'false';
  });

  const [activeTab, setActiveTab] = useState<'inbox' | 'automation' | 'simulator'>('inbox');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const processedMessageIds = useRef<Set<string>>(new Set());
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // 1. Fetch Providers on mount
  useEffect(() => {
    let mounted = true;
    fetchProviders().then((provList) => {
      if (!mounted) return;
      setProviders(provList);
      const activeP = provList.find((p) => p.id === currentProvider) || provList[0];
      if (activeP) {
        setAvailableDomains(activeP.domains);
        setSelectedDomain((curr) => (activeP.domains.includes(curr) ? curr : activeP.defaultDomain));
      }
    });
    return () => {
      mounted = false;
    };
  }, [currentProvider]);

  // 2. Generate Inbox
  const handleGenerateInbox = useCallback(
    async (
      targetProvider: 'guerrilla' | 'tempmaillol' | 'mailtm' = currentProvider,
      customPrefix?: string,
      domainChoice?: string
    ) => {
      setIsRefreshing(true);
      try {
        const newAcc = await createInbox(targetProvider, customPrefix, domainChoice);
        setAccount(newAcc);
        setCurrentProvider(newAcc.provider);
        localStorage.setItem('autotempmail_account', JSON.stringify(newAcc));
        localStorage.setItem('autotempmail_provider', newAcc.provider);

        setMessages([]);
        setSelectedMessageId(null);
        setSelectedMessageDetail(null);
        setLatestOtp(null);
        setLatestOtpMetadata(null);
        processedMessageIds.current.clear();
        notifyAutomationEmailChanged(newAcc.address);
        showToast(`Active Inbox: ${newAcc.address}`);
      } catch (err: unknown) {
        console.error('Failed to create inbox:', err);
        showToast('Error generating inbox. Retrying...');
      } finally {
        setIsRefreshing(false);
      }
    },
    [currentProvider, showToast]
  );

  // Initial account setup on first load
  const initializedRef = useRef(false);
  useEffect(() => {
    if ((!account || !account.address || !account.token) && !initializedRef.current) {
      initializedRef.current = true;
      handleGenerateInbox('guerrilla');
    }
  }, [account, handleGenerateInbox]);

  // Check URL query parameters (e.g., ?action=new, ?autocopy=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      handleGenerateInbox();
    }
    if (params.get('autocopy') === '1' || params.get('autocopy') === 'true') {
      setAutoCopyEnabled(true);
      localStorage.setItem('autotempmail_autocopy', 'true');
    }
  }, [handleGenerateInbox]);

  // Clipboard Helpers
  const copyOtpToClipboard = useCallback(async (): Promise<boolean> => {
    if (!latestOtp) return false;
    const ok = await safeWriteClipboard(latestOtp);
    if (ok) {
      showToast(`Copied OTP [${latestOtp}] to clipboard!`);
      return true;
    }
    showToast(`OTP [${latestOtp}] ready to copy`);
    return false;
  }, [latestOtp, showToast]);

  const copyEmailToClipboard = useCallback(async (): Promise<boolean> => {
    if (!account?.address) return false;
    const ok = await safeWriteClipboard(account.address);
    if (ok) {
      showToast(`Copied ${account.address} to clipboard!`);
      return true;
    }
    showToast(`Email ${account.address} ready`);
    return false;
  }, [account?.address, showToast]);

  // 3. Register Global window.TempMailAutomation bridge
  useEffect(() => {
    setupAutomationBridge(() => ({
      currentEmail: account?.address || '',
      latestOtp,
      latestOtpMetadata,
      inboxCount: messages.length,
      isPolling: isRefreshing,
      copyOtpToClipboard,
      copyEmailToClipboard,
      refreshInbox: async () => {
        await pollMessages();
      },
      generateNewEmail: async (prefix?: string) => {
        await handleGenerateInbox(currentProvider, prefix);
        return account?.address || '';
      },
      messages,
      activeMessage: selectedMessageDetail,
    }));
  }, [account?.address, latestOtp, latestOtpMetadata, messages, isRefreshing, selectedMessageDetail, copyOtpToClipboard, copyEmailToClipboard, handleGenerateInbox, currentProvider]);

  // 4. Poll Messages from API
  const pollMessages = useCallback(async () => {
    if (!account?.token || !account?.provider) return;
    try {
      setIsRefreshing(true);
      const list = await fetchMessages(account.provider, account.token);

      const updatedList: MailMessageSummary[] = [];

      for (const msg of list) {
        // Fast inspect intro and subject
        const quickOtp = extractOTP(msg.subject, msg.intro || msg.text || '');
        const msgSummary: MailMessageSummary = {
          ...msg,
          detectedOtp: msg.detectedOtp || quickOtp?.code || null,
        };
        updatedList.push(msgSummary);

        // Check if newly arrived message
        if (!processedMessageIds.current.has(msg.id)) {
          processedMessageIds.current.add(msg.id);
          notifyAutomationNewMessage(msgSummary);

          const foundCode = msgSummary.detectedOtp || quickOtp?.code;
          if (foundCode) {
            const serviceName = quickOtp?.service || msg.from?.name || 'Service';
            setLatestOtp(foundCode);
            setLatestOtpMetadata({
              code: foundCode,
              service: serviceName,
              timestamp: new Date().toISOString(),
              context: quickOtp?.contextSnippet || msg.subject,
            });

            notifyAutomationNewOTP(foundCode, {
              service: serviceName,
              timestamp: new Date().toISOString(),
              context: quickOtp?.contextSnippet || msg.subject,
            });

            if (soundEnabled) {
              playOtpChime();
            }

            if (autoCopyEnabled) {
              safeWriteClipboard(foundCode)
                .then((copied) => {
                  if (copied) {
                    showToast(`Auto-copied OTP [${foundCode}] to clipboard!`);
                  } else {
                    showToast(`New OTP Detected: ${foundCode}`);
                  }
                })
                .catch(() => {
                  showToast(`New OTP Detected: ${foundCode}`);
                });
            } else {
              showToast(`New OTP Detected: ${foundCode}`);
            }
          }
        }
      }

      setMessages((prev) => {
        const map = new Map<string, MailMessageSummary>();
        for (const m of prev) {
          map.set(m.id, m);
        }
        for (const m of updatedList) {
          map.set(m.id, m);
        }
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      // Select first email if none selected yet
      if (updatedList.length > 0 && !selectedMessageId) {
        setSelectedMessageId(updatedList[0].id);
      }
    } catch (err: unknown) {
      console.warn('Poll messages error:', err);
    } finally {
      setIsRefreshing(false);
      setNextRefreshSec(REFRESH_INTERVAL_SEC);
    }
  }, [account, selectedMessageId, soundEnabled, autoCopyEnabled, showToast]);

  // 5. Polling Interval Timer
  useEffect(() => {
    if (!account?.token) return;

    pollMessages();

    countdownRef.current = setInterval(() => {
      setNextRefreshSec((prev) => {
        if (prev <= 1) {
          pollMessages();
          return REFRESH_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [account?.token, pollMessages]);

  // 6. Load Full Message Details when selected
  useEffect(() => {
    if (!selectedMessageId) {
      setSelectedMessageDetail(null);
      return;
    }

    // Check if it's a simulated mock message
    const existingMock = messages.find((m) => m.id === selectedMessageId && m.id.startsWith('mock_'));
    if (existingMock && (existingMock as MailMessageDetail).html) {
      setSelectedMessageDetail(existingMock as MailMessageDetail);
      return;
    }

    if (!account?.token || !account?.provider) return;

    setIsLoadingDetail(true);
    fetchMessageDetail(account.provider, account.token, selectedMessageId)
      .then((detail) => {
        const fullOtp = extractOTP(
          detail.subject,
          detail.text || detail.intro,
          detail.html?.[0]
        );
        const enriched: MailMessageDetail = {
          ...detail,
          detectedOtp: detail.detectedOtp || fullOtp?.code || null,
        };
        setSelectedMessageDetail(enriched);

        if (enriched.detectedOtp) {
          setMessages((prev) =>
            prev.map((m) => (m.id === selectedMessageId ? { ...m, detectedOtp: enriched.detectedOtp } : m))
          );

          if (!latestOtp || latestOtp !== enriched.detectedOtp) {
            const serviceName = fullOtp?.service || enriched.from?.name || 'Service';
            setLatestOtp(enriched.detectedOtp);
            setLatestOtpMetadata({
              code: enriched.detectedOtp,
              service: serviceName,
              timestamp: new Date().toISOString(),
              context: fullOtp?.contextSnippet || enriched.subject,
            });

            notifyAutomationNewOTP(enriched.detectedOtp, {
              service: serviceName,
              timestamp: new Date().toISOString(),
              context: fullOtp?.contextSnippet || enriched.subject,
            });

            if (soundEnabled) {
              playOtpChime();
            }

            if (autoCopyEnabled) {
              safeWriteClipboard(enriched.detectedOtp)
                .then((copied) => {
                  if (copied) {
                    showToast(`Auto-copied OTP [${enriched.detectedOtp}] to clipboard!`);
                  } else {
                    showToast(`Captured OTP: ${enriched.detectedOtp}`);
                  }
                })
                .catch(() => {
                  showToast(`Captured OTP: ${enriched.detectedOtp}`);
                });
            } else {
              showToast(`Captured OTP: ${enriched.detectedOtp}`);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching detail:', err);
      })
      .finally(() => {
        setIsLoadingDetail(false);
      });
  }, [selectedMessageId, account?.token, account?.provider, messages, latestOtp]);

  // 7. Delete Message Handler
  const handleDeleteMessage = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (account?.token && account?.provider && !id.startsWith('mock_')) {
      await deleteMessage(account.provider, account.token, id);
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMessageId === id) {
      setSelectedMessageId(null);
      setSelectedMessageDetail(null);
    }
    showToast('Message deleted.');
  };

  // 8. Delete Entire Inbox
  const handleDeleteInbox = () => {
    if (confirm('Delete this inbox and generate a brand new one?')) {
      localStorage.removeItem('autotempmail_account');
      setAccount(null);
      handleGenerateInbox(currentProvider);
    }
  };

  // 9. Send Mock Verification Email (Simulator)
  const handleSendMock = (
    service: 'Google' | 'GitHub' | 'Discord' | 'Steam' | 'Stripe' | 'Custom',
    customCode?: string
  ) => {
    const mock = createMockOTPMessage(account?.address || 'temp@user.com', service, customCode);
    setMessages((prev) => [mock, ...prev]);
    setSelectedMessageId(mock.id);
    setSelectedMessageDetail(mock);

    if (mock.detectedOtp) {
      setLatestOtp(mock.detectedOtp);
      setLatestOtpMetadata({
        code: mock.detectedOtp,
        service: service === 'Custom' ? 'Verification Service' : service,
        timestamp: new Date().toISOString(),
        context: `Simulated ${service} email`,
      });

      notifyAutomationNewOTP(mock.detectedOtp, {
        service,
        timestamp: new Date().toISOString(),
      });

      if (soundEnabled) {
        playOtpChime();
      }

      if (autoCopyEnabled) {
        safeWriteClipboard(mock.detectedOtp)
          .then((copied) => {
            if (copied) {
              showToast(`Auto-copied simulated OTP [${mock.detectedOtp}]!`);
            } else {
              showToast(`Injected simulated OTP: ${mock.detectedOtp}`);
            }
          })
          .catch(() => {
            showToast(`Injected simulated OTP: ${mock.detectedOtp}`);
          });
      } else {
        showToast(`Injected simulated OTP: ${mock.detectedOtp}`);
      }
    }
  };

  // 10. Global Keyboard Shortcuts: O for OTP, E for Email, R for Refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'o' || e.key === 'O') {
        if (latestOtp) {
          copyOtpToClipboard();
        }
      } else if (e.key === 'e' || e.key === 'E') {
        copyEmailToClipboard();
      } else if (e.key === 'r' || e.key === 'R') {
        pollMessages();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [latestOtp, copyOtpToClipboard, copyEmailToClipboard, pollMessages]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Bar with Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'automation') {
            setShowAutomationModal(true);
          } else if (tab === 'simulator') {
            setShowSimulatorModal(true);
          } else {
            setActiveTab('inbox');
          }
        }}
        onNewEmailClick={() => handleGenerateInbox(currentProvider)}
        inboxCount={messages.length}
      />

      {/* Main Container - Desktop baseline 1440px */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Active Address Bar */}
        <ActiveEmailBar
          currentEmail={account?.address || ''}
          currentProvider={currentProvider}
          providers={providers}
          onChangeProvider={(p) => {
            setCurrentProvider(p);
            handleGenerateInbox(p);
          }}
          onCopyEmail={copyEmailToClipboard}
          isRefreshing={isRefreshing}
          onRefresh={pollMessages}
          nextRefreshSec={nextRefreshSec}
          onOpenCustomModal={() => setShowCustomModal(true)}
          onDeleteInbox={handleDeleteInbox}
          availableDomains={availableDomains}
          selectedDomain={selectedDomain}
          onSelectDomain={(dom) => {
            setSelectedDomain(dom);
            handleGenerateInbox(currentProvider, undefined, dom);
          }}
          onTriggerSimulator={() => setShowSimulatorModal(true)}
        />

        {/* Dedicated OTP Detection & "Only OTP Copy" Banner */}
        <LatestOtpBanner
          latestOtp={latestOtp}
          otpMetadata={latestOtpMetadata}
          onCopyOtp={copyOtpToClipboard}
          autoCopyEnabled={autoCopyEnabled}
          onToggleAutoCopy={(val) => {
            setAutoCopyEnabled(val);
            localStorage.setItem('autotempmail_autocopy', String(val));
            showToast(val ? 'Auto-copy OTP enabled' : 'Auto-copy OTP disabled');
          }}
          soundEnabled={soundEnabled}
          onToggleSound={(val) => {
            setSoundEnabled(val);
            localStorage.setItem('autotempmail_sound', String(val));
          }}
        />

        {/* Master-Detail Split Workspace for Desktop (Inbox List + Email Viewer) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[580px]">
          {/* Left Column: Email List (4/12 columns on desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 h-full min-h-[460px]">
            <EmailList
              messages={messages}
              selectedMessageId={selectedMessageId}
              onSelectMessage={(id) => setSelectedMessageId(id)}
              onDeleteMessage={handleDeleteMessage}
              onCopyOtpDirect={async (otp, e) => {
                e.stopPropagation();
                const ok = await safeWriteClipboard(otp);
                if (ok) {
                  showToast(`Copied OTP [${otp}]!`);
                } else {
                  showToast(`OTP: ${otp}`);
                }
              }}
            />
          </div>

          {/* Right Column: Email Viewer (7/12 or 8/12 columns on desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 h-full min-h-[460px]">
            <EmailViewer
              message={selectedMessageDetail}
              isLoading={isLoadingDetail}
              onDelete={(id) => handleDeleteMessage(id)}
              onCopyOtp={async (otp) => {
                const ok = await safeWriteClipboard(otp);
                if (ok) {
                  showToast(`Copied OTP [${otp}]!`);
                  return true;
                }
                showToast(`OTP: ${otp}`);
                return false;
              }}
              onTriggerSimulator={() => setShowSimulatorModal(true)}
            />
          </div>
        </div>

        {/* Bottom Automation Quick Bar / Keyboard Shortcuts Guide */}
        <footer className="mt-auto pt-4 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-400">Keyboard Shortcuts:</span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-300">
                O
              </kbd>{' '}
              Copy OTP
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-300">
                E
              </kbd>{' '}
              Copy Email
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-slate-300">
                R
              </kbd>{' '}
              Refresh
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAutomationModal(true)}
              className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>DOM Selector Reference</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400 font-mono">Guerrilla + TempMail Active</span>
          </div>
        </footer>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Extension Automation Helper Modal */}
      {showAutomationModal && (
        <AutomationHelperModal
          currentEmail={account?.address || ''}
          latestOtp={latestOtp}
          onClose={() => setShowAutomationModal(false)}
        />
      )}

      {/* Test Verification Simulator Modal */}
      {showSimulatorModal && (
        <TestEmailModal
          currentEmail={account?.address || ''}
          onSendMock={handleSendMock}
          onClose={() => setShowSimulatorModal(false)}
        />
      )}

      {/* Custom Email Modal */}
      {showCustomModal && (
        <CustomEmailModal
          availableDomains={availableDomains}
          selectedDomain={selectedDomain}
          onGenerate={async (prefix, dom) => {
            setSelectedDomain(dom);
            await handleGenerateInbox(currentProvider, prefix, dom);
          }}
          onClose={() => setShowCustomModal(false)}
        />
      )}
    </div>
  );
}
