const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../services/db');

router.use(auth);

router.get('/:cardId', async (req, res) => {
  const { cardId } = req.params;
  try {
    const result = await db.query(
      'SELECT "marketPrice", "lastPriceCheck" FROM "Card" WHERE id = $1 AND "userId" = $2',
      [cardId, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Card not found' });
    res.json({ price: result.rows[0].marketPrice || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

module.exports = router;
