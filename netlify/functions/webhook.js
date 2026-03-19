// Netlify serverless function — proxies webhook calls to GHL
// Keeps webhook URLs and location ID server-side only

const WEBHOOK_MAP = {
  '12-month-culture-calendar':             process.env.WEBHOOK_CULTURE_CALENDAR,
  '12-month-culture-calendar-apply':       process.env.WEBHOOK_CULTURE_CALENDAR,
  'culture-maturity-audit':                process.env.WEBHOOK_CULTURE_MATURITY_AUDIT,
  'culture-maturity-audit-application':    process.env.WEBHOOK_CULTURE_MATURITY_AUDIT,
  'founder-exposure-index':                process.env.WEBHOOK_FOUNDER_EXPOSURE_INDEX,
  'founder-exposure-index-apply':          process.env.WEBHOOK_FOUNDER_EXPOSURE_INDEX,
  'founder-bottleneck-eliminator':         process.env.WEBHOOK_FOUNDER_BOTTLENECK_ELIMINATOR,
  'founder-bottleneck-eliminator-apply':   process.env.WEBHOOK_FOUNDER_BOTTLENECK_ELIMINATOR,
  'events-speaker-request':               process.env.WEBHOOK_EVENTS,
  'homepage-contact':                      process.env.WEBHOOK_INDEX,
};

const GHL_BASE = 'https://services.leadconnectorhq.com/hooks';
const LOCATION_ID = process.env.GHL_LOCATION_ID;

// Simple in-memory rate limiting (per source, per IP)
const rateMap = new Map();
const RATE_LIMIT_MS = 2000;

function isRateLimited(key) {
  const now = Date.now();
  const last = rateMap.get(key) || 0;
  if (now - last < RATE_LIMIT_MS) return true;
  rateMap.set(key, now);
  // Clean old entries every 100 calls
  if (rateMap.size > 200) {
    for (const [k, v] of rateMap) {
      if (now - v > 60000) rateMap.delete(k);
    }
  }
  return false;
}

// Max payload size (10KB)
const MAX_BODY = 10240;

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Parse body
  let payload;
  try {
    if (event.body && event.body.length > MAX_BODY) {
      return { statusCode: 413, body: JSON.stringify({ error: 'Payload too large' }) };
    }
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Resolve webhook trigger from source field
  const source = String(payload.source || '').toLowerCase().trim();
  const triggerId = WEBHOOK_MAP[source];

  if (!triggerId || !LOCATION_ID) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown source' }) };
  }

  // Rate limit by IP + source
  const clientIp = (event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown').split(',')[0].trim();
  const rateKey = clientIp + ':' + source;
  if (isRateLimited(rateKey)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many requests' }) };
  }

  // Forward to GHL webhook
  const webhookUrl = `${GHL_BASE}/${LOCATION_ID}/webhook-trigger/${triggerId}`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return {
      statusCode: response.ok ? 200 : 502,
      body: JSON.stringify({ ok: response.ok }),
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Upstream failed' }) };
  }
};
