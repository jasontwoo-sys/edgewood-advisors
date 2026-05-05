export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ticker } = req.body;
  
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker required' });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.error || !data.c) {
      return res.status(400).json({ error: 'Invalid ticker or API error' });
    }

    const prevClose = data.pc || data.c;
    const currentPrice = data.c;
    const change = parseFloat((currentPrice - prevClose).toFixed(2));
    const change_pct = parseFloat(((change / prevClose) * 100).toFixed(2));

    return res.status(200).json({
      price: currentPrice,
      change,
      change_pct,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Finnhub API error:', error);
    return res.status(500).json({ error: 'Failed to fetch price data' });
  }
}
