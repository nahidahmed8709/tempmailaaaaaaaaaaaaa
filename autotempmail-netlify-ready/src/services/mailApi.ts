/**
 * Multi-Provider Temporary Mail Service
 * Powered by Guerrilla Mail (Universal Real-Mail Delivery), TempMail.lol, and Mail.tm.
 */

export interface MailProvider {
  id: string;
  name: string;
  badge: string;
  domains: string[];
  defaultDomain: string;
}

export interface MailAccount {
  id: string;
  address: string;
  provider: 'guerrilla' | 'tempmaillol' | 'mailtm';
  token: string;
  createdAt: string;
}

export interface MailAddress {
  address: string;
  name: string;
}

export interface MailAttachment {
  id: string;
  filename: string;
  contentType: string;
  disposition: string;
  transferEncoding: string;
  related: boolean;
  size: number;
  downloadUrl: string;
}

export interface MailMessageSummary {
  id: string;
  accountId: string;
  msgid: string;
  from: MailAddress;
  to: MailAddress[];
  subject: string;
  intro: string;
  seen: boolean;
  isDeleted: boolean;
  hasAttachments: boolean;
  size: number;
  createdAt: string;
  updatedAt: string;
  detectedOtp?: string | null;
  text?: string;
  html?: string[];
}

export interface MailMessageDetail extends MailMessageSummary {
  text: string;
  html: string[];
  attachments: MailAttachment[];
}

export async function fetchProviders(): Promise<MailProvider[]> {
  try {
    const res = await fetch('/api/inbox/providers');
    if (res.ok) {
      const data = await res.json();
      return data.providers;
    }
  } catch (err) {
    console.error('Failed to fetch providers:', err);
  }

  // Fallback defaults
  return [
    {
      id: 'guerrilla',
      name: 'Guerrilla Mail (Recommended)',
      badge: 'Highest Real OTP Delivery',
      domains: ['guerrillamailblock.com', 'sharklasers.com', 'guerrillamail.com', 'grr.la', 'pokemail.net'],
      defaultDomain: 'guerrillamailblock.com',
    },
    {
      id: 'tempmaillol',
      name: 'TempMail.lol',
      badge: 'Fresh Dynamic Domains',
      domains: ['lucktaro.com', 'xzcoot.com'],
      defaultDomain: 'lucktaro.com',
    },
    {
      id: 'mailtm',
      name: 'Mail.tm',
      badge: 'Permanent Account Token',
      domains: ['maxxspace.com'],
      defaultDomain: 'maxxspace.com',
    },
  ];
}

export async function createInbox(
  provider: 'guerrilla' | 'tempmaillol' | 'mailtm' = 'guerrilla',
  customUsername?: string,
  domainChoice?: string
): Promise<MailAccount> {
  const res = await fetch('/api/inbox/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      customUsername,
      domain: domainChoice,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create inbox: HTTP ${res.status}`);
  }

  const data: MailAccount = await res.json();
  return data;
}

export async function fetchMessages(
  provider: string,
  token: string
): Promise<MailMessageSummary[]> {
  if (!token) return [];

  const res = await fetch(`/api/inbox/messages?provider=${encodeURIComponent(provider)}&token=${encodeURIComponent(token)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch messages: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function fetchMessageDetail(
  provider: string,
  token: string,
  messageId: string
): Promise<MailMessageDetail> {
  const res = await fetch(
    `/api/inbox/message/${encodeURIComponent(messageId)}?provider=${encodeURIComponent(provider)}&token=${encodeURIComponent(token)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch message detail: HTTP ${res.status}`);
  }

  return await res.json();
}

export async function deleteMessage(
  provider: string,
  token: string,
  messageId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/inbox/message/${encodeURIComponent(messageId)}?provider=${encodeURIComponent(provider)}&token=${encodeURIComponent(token)}`,
      { method: 'DELETE' }
    );
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

/**
 * Generate a realistic simulated verification email for immediate testing.
 */
export function createMockOTPMessage(
  targetEmail: string,
  serviceName: 'Google' | 'GitHub' | 'Discord' | 'Steam' | 'Stripe' | 'Uber' | 'Custom',
  customCode?: string
): MailMessageDetail {
  const code = customCode || Math.floor(100000 + Math.random() * 900000).toString();
  const id = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  let senderName = 'Google Accounts';
  let senderEmail = 'no-reply@accounts.google.com';
  let subject = `${code} is your Google verification code`;
  let bodyText = `Google Verification Code\n\nUse this code to verify your account or device:\n\n${code}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.`;
  let bodyHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
        <span style="font-size: 20px; font-weight: 700; color: #0f172a;">${serviceName} Security</span>
      </div>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">We received a request to verify your account or complete authentication. Your one-time verification code is:</p>
      <div style="margin: 28px 0; padding: 20px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center;">
        <span class="otp-code" style="font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; display: inline-block;">${code}</span>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This OTP is valid for 10 minutes. For your security, never share this code with anyone.</p>
    </div>
  `;

  if (serviceName === 'GitHub') {
    senderName = 'GitHub';
    senderEmail = 'noreply@github.com';
    subject = `[GitHub] Please verify your device (OTP: ${code})`;
    bodyText = `Hey there!\n\nA sign in attempt requires further verification. Your device verification code is:\n\n${code}\n\nGitHub Support Team`;
  } else if (serviceName === 'Discord') {
    senderName = 'Discord';
    senderEmail = 'noreply@discord.com';
    subject = `Your Discord Security Code is ${code}`;
    bodyText = `Hey!\n\nYour Discord verification code is: ${code}\n\nIt expires in 5 minutes. Happy gaming!`;
  } else if (serviceName === 'Steam') {
    senderName = 'Steam Support';
    senderEmail = 'noreply@steampowered.com';
    const steamCode = customCode || Math.random().toString(36).substring(2, 7).toUpperCase();
    subject = `Your Steam account: Access from new computer`;
    bodyText = `Dear Steam User,\n\nHere is the Steam Guard code you need to log in:\n\n${steamCode}\n\nIf you did not attempt this, please change your password.`;
    return {
      id,
      accountId: 'local',
      msgid: `<${id}@steam.mock>`,
      from: { address: senderEmail, name: senderName },
      to: [{ address: targetEmail, name: 'User' }],
      subject,
      intro: `Here is the Steam Guard code you need to log in: ${steamCode}`,
      seen: false,
      isDeleted: false,
      hasAttachments: false,
      size: 1420,
      createdAt: now,
      updatedAt: now,
      text: bodyText,
      html: [bodyHtml.replace(code, steamCode)],
      attachments: [],
      detectedOtp: steamCode,
    };
  } else if (serviceName === 'Stripe') {
    senderName = 'Stripe Verification';
    senderEmail = 'support@stripe.com';
    subject = `${code} is your Stripe verification code`;
    bodyText = `Your one-time authorization code is: ${code}\n\nEnter this code on the payment screen to proceed.`;
  }

  return {
    id,
    accountId: 'local',
    msgid: `<${id}@mock>`,
    from: { address: senderEmail, name: senderName },
    to: [{ address: targetEmail, name: 'User' }],
    subject,
    intro: `Your verification code is ${code}`,
    seen: false,
    isDeleted: false,
    hasAttachments: false,
    size: 1250,
    createdAt: now,
    updatedAt: now,
    text: bodyText,
    html: [bodyHtml],
    attachments: [],
    detectedOtp: code,
  };
}
