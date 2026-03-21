const router = require('express').Router();
const auth = require('../middleware/auth');
const { askAgent } = require('../services/openai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(auth);

router.post('/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  // Get user's collection to give context to the AI
  const collection = await prisma.card.findMany({
    where: { userId: req.userId }
  });

  try {
    const answer = await askAgent(question, collection);
    res.json({ answer });
  } catch (err) {
    console.error('Agent error:', err);
    res.status(500).json({ error: 'AI agent failed to respond' });
  }
});

module.exports = router;
