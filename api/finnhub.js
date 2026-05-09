// Vercel Serverless Function - Finnhub Proxy
// File: /api/finnhub.js
// Purpose: Fetch stock prices from Finnhub with CORS headers

export default async (req, res) => {
  // ====================================================================
  // CORS Headers - Allow all origins
  // ====================================================================
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight (browser sends OPTIONS before GET)
  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  // ====================================================================
  // Get parameters from query string
  // ====================================================================
  const symbol = req.query.symbol;
  const token = req.query.token;

  console.log(`[proxy] Received: symbol=${symbol}, token=${token ? 'YES' : 'NO'}`);

  // Validate we have what we need
  if (!symbol || !token) {
    return res.status(400).json({
      error: 'Missing symbol or token',
      received: { symbol, token }
    });
  }

  // ====================================================================
  // Call Finnhub API
  // ====================================================================
  try {
    const finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`;
    
    console.log(`[proxy] Calling Finnhub: ${finnhubUrl.split('token=')[0]}token=***`);

    const response = await fetch(finnhubUrl);
    const data = await response.json();

    console.log(`[proxy] Finnhub response:`, data);

    // Check if we got a valid price
    if (!data.c) {
      console.log(`[proxy] No price in response`);
      return res.status(400).json({
        error: 'No price data from Finnhub',
        data: data
      });
    }

    console.log(`[proxy] SUCCESS: ${symbol} = $${data.c}`);

    // Return the data
    return res.status(200).json({
      c: data.c,    // current price
      d: data.d,    // change
      dp: data.dp,  // percent change
      h: data.h,    // high
      l: data.l,    // low
      o: data.o,    // open
      v: data.v     // volume
    });

  } catch (error) {
    console.error(`[proxy] ERROR:`, error.message);
    return res.status(500).json({
      error: `Proxy error: ${error.message}`
    });
  }
};
