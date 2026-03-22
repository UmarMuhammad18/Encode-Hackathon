const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../services/db');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM "Card" WHERE "userId" = $1 ORDER BY "addedAt" DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', async (req, res) => {
  const { name, set, number, rarity, condition, quantity, language, notes } = req.body;
  if (!name || !set) return res.status(400).json({ error: 'Name and set required' });
  try {
    const result = await db.query(
      `INSERT INTO "Card" (name, set, number, rarity, condition, quantity, language, notes, "userId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, set, number, rarity || 'Common', condition || 'Near Mint', quantity || 1, language || 'English', notes, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add card' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;
  try {
    const result = await db.query(
      'UPDATE "Card" SET quantity = $1, notes = $2 WHERE id = $3 AND "userId" = $4 RETURNING *',
      [quantity, notes, id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Card not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM "Card" WHERE id = $1 AND "userId" = $2 RETURNING id', [id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Card not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });

// Bulk import cards
router.post('/bulk', async (req, res) => {
  const cards = req.body.cards;
  if (!Array.isArray(cards)) return res.status(400).json({ error: 'Invalid data' });
  const inserted = [];
  for (const card of cards) {
    const { name, set, number, rarity, condition, quantity, language, notes } = card;
    if (!name || !set) continue;
    const result = await db.query(
      `INSERT INTO "Card" (id, name, set, number, rarity, condition, quantity, language, notes, "addedAt", "userId")
       VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, DEFAULT, $9) RETURNING *`,
      [name, set, number, rarity || 'Common', condition || 'Near Mint', quantity || 1, language || 'English', notes, req.userId]
    );
    inserted.push(result.rows[0]);
  }
  res.json({ imported: inserted.length });
});
  }
});

router.get('/analytics', auth, async (req, res) => {
  try {
    // Get counts by set
    const sets = await db.query('SELECT set, COUNT(*) as count, SUM(quantity) as total_qty FROM "Card" WHERE "userId" = $1 GROUP BY set', [req.userId]);
    // by rarity
    const rarities = await db.query('SELECT rarity, COUNT(*) as count, SUM(quantity) as total_qty FROM "Card" WHERE "userId" = $1 GROUP BY rarity', [req.userId]);
    // by condition
    const conditions = await db.query('SELECT condition, COUNT(*) as count, SUM(quantity) as total_qty FROM "Card" WHERE "userId" = $1 GROUP BY condition', [req.userId]);
    // total value (using marketPrice if available)
    const value = await db.query('SELECT SUM(quantity * "marketPrice") as total FROM "Card" WHERE "userId" = $1 AND "marketPrice" IS NOT NULL', [req.userId]);
    res.json({ sets: sets.rows, rarities: rarities.rows, conditions: conditions.rows, totalValue: value.rows[0]?.total || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analytics error' });
  }
});

module.exports = router;
