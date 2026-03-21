const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all cards for logged-in user
router.get('/', async (req, res) => {
  const cards = await prisma.card.findMany({ where: { userId: req.userId } });
  res.json(cards);
});

// Add a card
router.post('/', async (req, res) => {
  const { name, set, number, rarity, condition, quantity, language, notes } = req.body;
  const card = await prisma.card.create({
    data: {
      name, set, number, rarity, condition,
      quantity: quantity || 1,
      language: language || 'English',
      notes,
      userId: req.userId
    }
  });
  res.json(card);
});

// Update quantity or notes
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { quantity, notes } = req.body;
  const card = await prisma.card.update({
    where: { id, userId: req.userId },
    data: { quantity, notes }
  });
  res.json(card);
});

// Delete a card
router.delete('/:id', async (req, res) => {
  await prisma.card.delete({ where: { id: req.params.id, userId: req.userId } });
  res.json({ success: true });
});

module.exports = router;
