const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../services/db');
const { fetchMarketPrice } = require('../services/tcgplayer');

router.use(auth);

// Get market price for a card, optionally refresh
router.get('/:cardId', async (req, res) => {
  const { cardId } = req.params;
  const { refresh } = req.query;
  try {
    // First get card
    const cardResult = await db.query('SELECT name, set, "marketPrice", "lastPriceCheck" FROM "Card" WHERE id = $1 AND "userId" = $2', [cardId, req.userId]);
    if (cardResult.rows.length === 0) return res.status(404).json({ error: 'Card not found' });
    const card = cardResult.rows[0];
    let price = card.marketPrice;
    let shouldRefresh = refresh === 'true';
    if (!shouldRefresh && (!card.lastPriceCheck || (Date.now() - new Date(card.lastPriceCheck) > 24 * 60 * 60 * 1000))) {
      shouldRefresh = true;
    }
    if (shouldRefresh) {
      price = await fetchMarketPrice(card.name, card.set);
      if (price !== null) {
        await db.query('UPDATE "Card" SET "marketPrice" = $1, "lastPriceCheck" = NOW() WHERE id = $2', [price, cardId]);
      }
    }
    res.json({ price });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

// Bulk fetch prices for all user's cards (for portfolio value)
router.get('/bulk', async (req, res) => {
  try {
    const cards = await db.query('SELECT id, name, set, quantity, "marketPrice" FROM "Card" WHERE "userId" = $1', [req.userId]);
    // For simplicity, we'll return current prices; in production you might refresh outdated ones.
    res.json(cards.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

module.exports = router;

// Get portfolio value
router.get('/portfolio/value', async (req, res) => {
  try {
    const cards = await db.query('SELECT quantity, "marketPrice" FROM "Card" WHERE "userId" = $1 AND "marketPrice" IS NOT NULL', [req.userId]);
    let totalValue = 0;
    for (const card of cards.rows) {
      totalValue += card.quantity * (card.marketPrice || 0);
    }
    res.json({ totalValue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute portfolio value' });
  }
});
