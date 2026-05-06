// Vercel API Route - Finnhub Proxy with CORS
// File: /api/finnhub.js

export default async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol, token } = req.query;

    // Validate inputs
    if (!symbol) {
      return res.status(400).json({ error: 'Missing symbol' });
    }

    if (!token) {
      return res.status(400).json({ error: 'Missing token' });
    }

    // Validate symbol format
    if (!/^[A-Z]{1,5}$/.test(symbol)) {
      return res.status(400).json({ error: 'Invalid symbol' });
    }

    console.log(`[finnhub.js] Fetching ${symbol}`);

    // Call Finnhub API
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`;
    
    const response = await fetch(url);
    const data = await response.json();

    // Check for errors from Finnhub
    if (!data || !data.c) {
      console.log(`[finnhub.js] No data for ${symbol}`);
      return res.status(200).json({
        c: null,
        error: 'No price data'
      });
    }

    console.log(`[finnhub.js] ✓ ${symbol}: $${data.c}`);

    // Return the price data
    return res.status(200).json({
      c: data.c,    // current
      d: data.d,    // change
      dp: data.dp,  // percent
      h: data.h,    // high
      l: data.l,    // low
      o: data.o,    // open
      v: data.v     // volume
    });

  } catch (error) {
    console.error('[finnhub.js] Error:', error.message);
    return res.status(500).json({
      error: error.message
    });
  }
};
