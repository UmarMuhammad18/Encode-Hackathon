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
  }
});

module.exports = router;