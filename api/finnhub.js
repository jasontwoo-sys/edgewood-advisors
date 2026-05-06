// api/finnhub.js
// Vercel Serverless Function - Backend Proxy for Finnhub API
// This avoids CORS issues by calling the API from the server

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol, token } = req.query;

  // Validate inputs
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol required' });
  }

  if (!token) {
    return res.status(400).json({ error: 'API token required' });
  }

  try {
    // Call Finnhub API from backend (no CORS issues!)
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Finnhub API returned ${response.status}` 
      });
    }

    const data = await response.json();

    // Return the data
    return res.status(200).json(data);

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch from Finnhub',
      message: error.message 
    });
  }
}
