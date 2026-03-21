const router = require('express').Router();
const auth = require('../middleware/auth');
const { fetchMarketPrice } = require('../services/tcgplayer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(auth);

// Get market price for a specific card (by card ID)
router.get('/:cardId', async (req, res) => {
  const { cardId } = req.params;
  const card = await prisma.card.findFirst({
    where: { id: cardId, userId: req.userId }
  });
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  let price = card.marketPrice;
  // Refresh if older than 24 hours
  if (!card.lastPriceCheck || (Date.now() - new Date(card.lastPriceCheck) > 24 * 60 * 60 * 1000)) {
    price = await fetchMarketPrice(card.name, card.set);
    if (price !== null) {
      await prisma.card.update({
        where: { id: card.id },
        data: { marketPrice: price, lastPriceCheck: new Date() }
      });
    }
  }
  res.json({ price });
});

module.exports = router;
