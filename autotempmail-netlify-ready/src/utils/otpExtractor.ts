/**
 * Advanced OTP Extraction Engine for AutoTempMail
 * Extracts 4-8 digit numeric codes, alphanumeric tokens, and formatted verification tokens.
 */

export interface DetectedOTP {
  code: string;
  service: string;
  confidence: 'high' | 'medium' | 'low';
  type: 'numeric' | 'alphanumeric' | 'formatted';
  contextSnippet: string;
}

const SERVICE_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: 'Google', regex: /\b(google|gmail|workspace)\b/i },
  { name: 'GitHub', regex: /\b(github)\b/i },
  { name: 'Discord', regex: /\b(discord)\b/i },
  { name: 'Steam', regex: /\b(steam|valve)\b/i },
  { name: 'Stripe', regex: /\b(stripe)\b/i },
  { name: 'Amazon', regex: /\b(amazon|aws)\b/i },
  { name: 'Microsoft', regex: /\b(microsoft|azure|xbox|outlook)\b/i },
  { name: 'Twitter / X', regex: /\b(twitter|x\.com)\b/i },
  { name: 'OpenAI', regex: /\b(openai|chatgpt)\b/i },
  { name: 'Apple', regex: /\b(apple|icloud)\b/i },
  { name: 'PayPal', regex: /\b(paypal)\b/i },
  { name: 'Uber', regex: /\b(uber|uber\s?eats)\b/i },
  { name: 'Netflix', regex: /\b(netflix)\b/i },
  { name: 'Spotify', regex: /\b(spotify)\b/i },
  { name: 'Telegram', regex: /\b(telegram)\b/i },
  { name: 'WhatsApp', regex: /\b(whatsapp|meta)\b/i },
  { name: 'Facebook', regex: /\b(facebook|meta)\b/i },
  { name: 'Instagram', regex: /\b(instagram)\b/i },
  { name: 'Roblox', regex: /\b(roblox)\b/i },
  { name: 'Shopify', regex: /\b(shopify)\b/i },
  { name: 'Twitch', regex: /\b(twitch)\b/i },
  { name: 'Binance', regex: /\b(binance)\b/i },
  { name: 'Coinbase', regex: /\b(coinbase)\b/i },
  { name: 'Epic Games', regex: /\b(epic\s?games)\b/i },
];

const COMMON_WORDS = new Set([
  'hello', 'thank', 'thanks', 'please', 'regards', 'support', 'welcome',
  'account', 'security', 'device', 'service', 'expires', 'minute', 'minutes',
  'seconds', 'ignore', 'anyone', 'notice', 'center', 'privacy', 'team',
  'click', 'verify', 'verification', 'confirm', 'email', 'address', 'password',
  'guerrilla', 'temporary', 'disposable', 'friend', 'inbox'
]);

export function detectService(from: string, subject: string, body: string): string {
  const combined = `${from} ${subject} ${body}`.toLowerCase();
  for (const { name, regex } of SERVICE_PATTERNS) {
    if (regex.test(combined)) {
      return name;
    }
  }

  const match = from.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (match) {
    const domainParts = match[1].split('.');
    const company = domainParts[domainParts.length - 2];
    if (company && company.length > 2 && company !== 'guerrillamail' && company !== 'guerrillamailblock') {
      return company.charAt(0).toUpperCase() + company.slice(1);
    }
  }

  return 'Verification Service';
}

function isValidOtp(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().toLowerCase();
  if (COMMON_WORDS.has(clean)) return false;
  
  // Exclude common years
  const num = parseInt(code, 10);
  if (!isNaN(num) && num >= 2020 && num <= 2035 && code.length === 4) {
    return false;
  }
  
  // Must contain digits or formatted tokens
  if (!/\d/.test(code) && code.length < 5) return false;
  return code.length >= 4 && code.length <= 10;
}

export function extractOTP(subject: string, textBody: string, htmlBody?: string): DetectedOTP | null {
  const rawHtml = htmlBody || '';
  const strippedHtml = rawHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ');

  const searchCorpus = `${subject}\n\n${textBody}\n\n${strippedHtml}`;
  const service = detectService('', subject, searchCorpus);

  // 1. High-confidence contextual patterns
  const contextualPatterns = [
    // "123456 is your verification code"
    /([A-Z0-9-]{4,10})\s+(?:is\s+your\s+(?:verification|security|confirmation|login|one-time|otp)\s+code)/i,
    // "verification code: 123456" / "verification code is 123456"
    /(?:verification|security|confirmation|validation|one-time|otp|login|auth|device|access)\s+(?:code|passcode|pin|password|token)(?:\s+is)?[\s:=-]+([A-Z0-9-]{4,10})/i,
    // "your code is 123456"
    /(?:your|the)\s+(?:verification|security|login|otp|confirmation)?\s*(?:code|pin|otp)(?:\s+is)?[\s:=-]+([A-Z0-9-]{4,10})/i,
    // "use 123456 to verify"
    /(?:use|enter)\s+([A-Z0-9-]{4,10})\s+(?:to\s+(?:verify|login|sign\s?in|confirm|authenticate))/i,
    // Prefixed tokens: G-123456
    /\b([A-Z]{1,4}-\d{4,8})\b/i,
    // Hyphenated numbers: 123-456
    /\b(\d{3,4}-\d{3,4})\b/,
  ];

  for (const pattern of contextualPatterns) {
    const match = searchCorpus.match(pattern);
    if (match && match[1]) {
      const code = match[1].trim().replace(/[.,;:!?)]$/, '');
      if (isValidOtp(code)) {
        return {
          code,
          service,
          confidence: 'high',
          type: /^\d+$/.test(code) ? 'numeric' : (code.includes('-') ? 'formatted' : 'alphanumeric'),
          contextSnippet: match[0].trim(),
        };
      }
    }
  }

  // 2. HTML styled elements (e.g. font-size 20px+ or class containing code/otp)
  if (htmlBody) {
    const htmlOtpMatches = [
      /<(?:td|span|div|p|h[1-4]|b|strong)[^>]*class=["'][^"']*(?:code|otp|token|pin|digit)[^"']*["'][^>]*>\s*([A-Z0-9\s-]{4,10})\s*<\//i,
      /<(?:td|span|div|p|h[1-4]|b|strong)[^>]*style=["'][^"']*(?:font-size:\s*(?:2[0-9]|3[0-9]|4[0-9])px|letter-spacing)[^"']*["'][^>]*>\s*([A-Z0-9\s-]{4,10})\s*<\//i,
    ];

    for (const pattern of htmlOtpMatches) {
      const match = htmlBody.match(pattern);
      if (match && match[1]) {
        const clean = match[1].replace(/\s+/g, '').trim().replace(/[.,;:!?)]$/, '');
        if (isValidOtp(clean)) {
          return {
            code: clean,
            service,
            confidence: 'high',
            type: /^\d+$/.test(clean) ? 'numeric' : 'alphanumeric',
            contextSnippet: `Styled code element: ${clean}`,
          };
        }
      }
    }
  }

  // 3. Subject line standalone 4-8 digits
  const subjectCodeMatch = subject.match(/\b(\d{4,8})\b/);
  if (subjectCodeMatch) {
    const code = subjectCodeMatch[1];
    if (isValidOtp(code)) {
      return {
        code,
        service,
        confidence: 'high',
        type: 'numeric',
        contextSnippet: `Subject: ${subject}`,
      };
    }
  }

  // 4. Standalone 6-digit number in the body
  const sixDigitMatch = searchCorpus.match(/(?:^|\s|>|:)([0-9]{6})(?:\s|<|$|\.)/);
  if (sixDigitMatch && isValidOtp(sixDigitMatch[1])) {
    return {
      code: sixDigitMatch[1],
      service,
      confidence: 'medium',
      type: 'numeric',
      contextSnippet: `6-digit verification code: ${sixDigitMatch[1]}`,
    };
  }

  // 5. Standalone 4, 5, 7, or 8 digit numbers in body text
  const otherDigitsMatch = searchCorpus.match(/(?:^|\s|>|:)([0-9]{4,5}|[0-9]{7,8})(?:\s|<|$|\.)/);
  if (otherDigitsMatch && isValidOtp(otherDigitsMatch[1])) {
    return {
      code: otherDigitsMatch[1],
      service,
      confidence: 'medium',
      type: 'numeric',
      contextSnippet: `${otherDigitsMatch[1].length}-digit code: ${otherDigitsMatch[1]}`,
    };
  }

  return null;
}
