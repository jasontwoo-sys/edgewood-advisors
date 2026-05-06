/**
 * Finnhub API Proxy - Vercel Serverless Function
 * Location: /api/finnhub.js in your GitHub repo
 * Purpose: Fetch stock prices from Finnhub with CORS headers enabled
 * 
 * CORS Setup:
 * - Allows requests from any origin (adjust for production security)
 * - Includes proper error handling
 * - Validates inputs before calling Finnhub
 * - Returns proper HTTP status codes
 */

export default async function handler(req, res) {
  // ====================================================================
  // CORS Headers - Allow cross-origin requests
  // ====================================================================
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins (or restrict to your domain)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // Handle preflight requests (OPTIONS method)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ====================================================================
  // Validate incoming request
  // ====================================================================
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, token } = req.query;

  // Validate symbol
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid symbol parameter' });
  }

  if (!/^[A-Z]{1,5}$/.test(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol format' });
  }

  // Validate token
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing API token' });
  }

  // ====================================================================
  // Fetch from Finnhub API
  // ====================================================================
  try {
    console.log(`[Proxy] Fetching ${symbol} from Finnhub...`);

    const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;

    const response = await fetch(finnhubUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      console.error(`[Proxy] Finnhub returned ${response.status} for ${symbol}`);
      return res.status(response.status).json({
        error: `Finnhub API error: ${response.status}`,
        symbol
      });
    }

    const data = await response.json();

    // ====================================================================
    // Validate response data
    // ====================================================================
    if (!data.c) {
      console.warn(`[Proxy] No price data for ${symbol}`);
      return res.status(400).json({
        error: `No price data available for ${symbol}`,
        symbol
      });
    }

    console.log(`[Proxy] ✓ ${symbol}: $${data.c}`);

    // ====================================================================
    // Return the data
    // ====================================================================
    return res.status(200).json({
      c: data.c,        // current price
      d: data.d || 0,   // change
      dp: data.dp || 0, // change percent
      h: data.h,        // high
      l: data.l,        // low
      o: data.o,        // open
      v: data.v,        // volume
      t: data.t         // timestamp
    });

  } catch (error) {
    console.error(`[Proxy] Error fetching ${symbol}:`, error.message);

    return res.status(500).json({
      error: `Error fetching price: ${error.message}`,
      symbol
    });
  }
}
