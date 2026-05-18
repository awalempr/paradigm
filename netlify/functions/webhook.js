// Netlify serverless function — proxies webhook calls to GHL
// Keeps webhook URLs and location ID server-side only

const WEBHOOK_MAP = {
  '12-month-culture-calendar':             process.env.WEBHOOK_CULTURE_CALENDAR,
  '12-month-culture-calendar-apply':       process.env.WEBHOOK_CULTURE_CALENDAR,
  'culture-maturity-audit':                process.env.WEBHOOK_CULTURE_MATURITY_AUDIT,
  'culture-maturity-audit-apply':          process.env.WEBHOOK_CULTURE_MATURITY_AUDIT,
  'founder-exposure-index':                process.env.WEBHOOK_FOUNDER_EXPOSURE_INDEX,
  'founder-exposure-index-apply':          process.env.WEBHOOK_FOUNDER_EXPOSURE_INDEX,
  'founder-bottleneck-eliminator':         process.env.WEBHOOK_FOUNDER_BOTTLENECK_ELIMINATOR,
  'founder-bottleneck-eliminator-apply':   process.env.WEBHOOK_FOUNDER_BOTTLENECK_ELIMINATOR,
  'compliance-spine':                      process.env.WEBHOOK_COMPLIANCE_SPINE,
  'compliance-spine-apply':                process.env.WEBHOOK_COMPLIANCE_SPINE,
  'compliance-spine-risk-map':             process.env.WEBHOOK_COMPLIANCE_SPINE_RISK_MAP,
  'leverage-engine':                       process.env.WEBHOOK_LEVERAGE_ENGINE,
  'leverage-engine-apply':                 process.env.WEBHOOK_LEVERAGE_ENGINE,
  'system-architecture-audit':             process.env.WEBHOOK_SYSTEM_ARCHITECTURE_AUDIT,
  'system-architecture-audit-apply':       process.env.WEBHOOK_SYSTEM_ARCHITECTURE_AUDIT,
  'events-speaker-request':               process.env.WEBHOOK_EVENTS,
  'mastermind-waitlist':                   process.env.WEBHOOK_MASTERMIND_WAITLIST,
  'homepage-contact':                      process.env.WEBHOOK_INDEX,
};

const GHL_BASE = 'https://services.leadconnectorhq.com/hooks';
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const MAX_BODY = 10240; // 10KB

// --- Input Sanitization & Validation ---
// Server-side — never trust client-side validation alone

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[\d\s\-+().]{7,20}$/;

// Strip control chars, collapse whitespace, enforce max length
function sanitizeStr(val, maxLen) {
  if (val == null) return '';
  return String(val)
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '') // strip control chars (keep \n, \r, \t)
    .replace(/\s+/g, ' ')                                 // collapse whitespace
    .trim()
    .substring(0, maxLen || 500);
}

// Sanitize every string value in a flat or nested object
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizePayload(obj, depth) {
  if (depth > 3) return {};  // prevent deeply nested abuse
  depth = depth || 0;
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (BLOCKED_KEYS.has(key)) continue;  // prevent prototype pollution
    const safeKey = sanitizeStr(key, 50);
    if (safeKey === '' || BLOCKED_KEYS.has(safeKey)) continue;
    if (val === null || val === undefined) {
      clean[safeKey] = '';
    } else if (typeof val === 'string') {
      clean[safeKey] = sanitizeStr(val, 2000);
    } else if (typeof val === 'number' && Number.isFinite(val)) {
      clean[safeKey] = val;
    } else if (typeof val === 'boolean') {
      clean[safeKey] = val;
    } else if (Array.isArray(val)) {
      clean[safeKey] = val.slice(0, 100).map(function(item) {
        if (typeof item === 'string') return sanitizeStr(item, 2000);
        if (typeof item === 'number' && Number.isFinite(item)) return item;
        if (typeof item === 'boolean') return item;
        if (typeof item === 'object' && item !== null) return sanitizePayload(item, depth + 1);
        return '';
      });
    } else if (typeof val === 'object') {
      clean[safeKey] = sanitizePayload(val, depth + 1);
    }
    // Silently drop functions, symbols, Infinity, NaN
  }
  return clean;
}

// Format phone to GHL-expected format
// Client sends: "+CC XXXXXXXXX" (country code + local number)
function formatPhoneForGHL(raw) {
  if (!raw) return '';
  var str = String(raw).trim();
  // Extract country code prefix (e.g. "+1 4074905167" or "+44 7911123456")
  var match = str.match(/^\+(\d+)\s+(.*)/);
  if (match) {
    var cc = match[1];
    var local = match[2].replace(/\D/g, '');
    // US/Canada: format as +1 (XXX) XXX-XXXX
    if (cc === '1' && local.length === 10) {
      return '+1 (' + local.substring(0, 3) + ') ' + local.substring(3, 6) + '-' + local.substring(6);
    }
    // International: +CC followed by digits
    return '+' + cc + local;
  }
  // Fallback: strip to digits and assume US if 10 digits
  var digits = str.replace(/\D/g, '');
  if (digits.length === 10) {
    return '+1 (' + digits.substring(0, 3) + ') ' + digits.substring(3, 6) + '-' + digits.substring(6);
  }
  if (digits.length === 11 && digits[0] === '1') {
    return '+1 (' + digits.substring(1, 4) + ') ' + digits.substring(4, 7) + '-' + digits.substring(7);
  }
  return '+' + digits;
}

// Validate required fields based on source type
function validateFields(source, data) {
  const errors = [];

  // All sources require a valid email
  if (data.email) {
    if (!EMAIL_RE.test(data.email)) {
      errors.push('Invalid email format');
    }
  }

  // Validate phone if present
  if (data.phone && !PHONE_RE.test(data.phone)) {
    errors.push('Invalid phone format');
  }

  // Name required for application/contact sources
  const needsName = ['homepage-contact', 'events-speaker-request',
    '12-month-culture-calendar-apply', 'culture-maturity-audit-apply',
    'founder-exposure-index-apply', 'founder-bottleneck-eliminator-apply',
    'leverage-engine-apply', 'system-architecture-audit-apply',
    'compliance-spine-risk-map'];
  if (needsName.includes(source)) {
    if (!data.name && !data.firstName && !data.first_name) {
      errors.push('Name is required');
    }
  }

  // Honeypot check — if a "company_url" hidden field is filled, it's a bot
  if (data.company_url) {
    errors.push('Bot detected');
  }

  return errors;
}

// --- Rate Limiting ---
// In-memory rate limiter (per-Lambda-instance, resets on cold start).
// A coordinated attacker hitting different warm starts could exceed the
// per-IP+source cap, but for typical form-spam this is sufficient.

const memoryMap = new Map();
const MEMORY_RATE_MS = 2000;

function isMemoryLimited(key) {
  const now = Date.now();
  const last = memoryMap.get(key) || 0;
  if (now - last < MEMORY_RATE_MS) return true;
  memoryMap.set(key, now);
  if (memoryMap.size > 200) {
    for (const [k, v] of memoryMap) {
      if (now - v > 60000) memoryMap.delete(k);
    }
  }
  return false;
}

function getClientIp(event) {
  return (event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown')
    .split(',')[0].trim();
}

async function checkRateLimit(ip, source) {
  if (isMemoryLimited(ip + ':' + source)) {
    return { limited: true, retryAfter: 2 };
  }
  return { limited: false };
}

exports.handler = async (event) => {
  // CORS headers for browser requests
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://paradigmconsulting.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const clientIp = getClientIp(event);

  // Parse body
  let payload;
  try {
    if (event.body && event.body.length > MAX_BODY) {
      return { statusCode: 413, headers, body: JSON.stringify({ error: 'Payload too large' }) };
    }
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Resolve webhook trigger from source field
  const source = String(payload.source || '').toLowerCase().trim();
  const triggerId = WEBHOOK_MAP[source];

  if (!triggerId || !LOCATION_ID) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown source' }) };
  }

  // Server-side validation (never trust client-side alone)
  const validationErrors = validateFields(source, payload);
  if (validationErrors.length > 0) {
    return { statusCode: 422, headers, body: JSON.stringify({ error: validationErrors[0] }) };
  }

  // Sanitize entire payload — strip control chars, enforce types/lengths
  const cleanPayload = sanitizePayload(payload);

  // Format phone to GHL-expected format: +1 (XXX) XXX-XXXX
  if (cleanPayload.phone) {
    cleanPayload.phone = formatPhoneForGHL(cleanPayload.phone);
  }

  // Rate limit check
  const rateCheck = await checkRateLimit(clientIp, source);
  if (rateCheck.limited) {
    return {
      statusCode: 429,
      headers: { ...headers, 'Retry-After': String(rateCheck.retryAfter) },
      body: JSON.stringify({ error: 'Too many requests' }),
    };
  }

  // Forward sanitized payload to GHL webhook
  const webhookUrl = `${GHL_BASE}/${LOCATION_ID}/webhook-trigger/${triggerId}`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    });

    return {
      statusCode: response.ok ? 200 : 502,
      headers,
      body: JSON.stringify({ ok: response.ok }),
    };
  } catch (e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Upstream failed' }) };
  }
};
