const axios = require('axios');

let accessToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  if (accessToken && tokenExpiry > Date.now()) return accessToken;
  try {
    const response = await axios.post('https://api.tcgplayer.com/token', {
      client_id: process.env.TCGPLAYER_CLIENT_ID,
      client_secret: process.env.TCGPLAYER_CLIENT_SECRET,
      grant_type: 'client_credentials'
    });
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;
    return accessToken;
  } catch (err) {
    console.error('TCGplayer token error:', err.message);
    return null;
  }
}

async function fetchMarketPrice(cardName, setName) {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    // Search for product
    const searchRes = await axios.get('https://api.tcgplayer.com/catalog/products', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: `${cardName} ${setName}`, limit: 1 }
    });
    if (!searchRes.data.results || searchRes.data.results.length === 0) return null;
    const productId = searchRes.data.results[0].productId;
    // Get pricing
    const priceRes = await axios.get(`https://api.tcgplayer.com/pricing/product/${productId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const priceData = priceRes.data.results[0];
    return priceData?.marketPrice || null;
  } catch (err) {
    console.error('TCGplayer fetch error:', err.message);
    return null;
  }
}

module.exports = { fetchMarketPrice };
