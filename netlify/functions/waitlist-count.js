const { Redis } = require('@upstash/redis');

const WAITLIST_CAP = 100;

exports.handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const allowed = origin.includes('paradigmconsulting.io') || origin.includes('localhost');
  const headers = {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://paradigmconsulting.io',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const count = (await redis.get('mastermind-waitlist-count')) || 0;
    const remaining = Math.max(0, WAITLIST_CAP - Number(count));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ count: Number(count), remaining, cap: WAITLIST_CAP }),
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to read count' }) };
  }
};
