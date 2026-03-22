const router = require('express').Router();
const auth = require('../middleware/auth');
const { askAgent } = require('../services/openai');
const { getCivicGuard } = require('../services/civic-guard');
const db = require('../services/db');

const civic = getCivicGuard();

router.post('/ask', auth, async (req, res) => {
  const { question } = req.body;
  const userId = req.userId;
  if (!question) return res.status(400).json({ error: 'Question required' });

  const inputCheck = await civic.validateInput(userId, question, { source: 'web' });
  if (!inputCheck.isValid) {
    return res.status(400).json({ error: 'Input blocked for safety', warnings: inputCheck.warnings });
  }

  try {
    const collectionResult = await db.query('SELECT * FROM "Card" WHERE "userId" = $1', [userId]);
    const collection = collectionResult.rows;
    const rawAnswer = await askAgent(inputCheck.sanitized, collection);
    const outputCheck = await civic.validateOutput(userId, rawAnswer);
    await civic.logSecurityEvent(userId, 'agent_query', { question: inputCheck.sanitized.substring(0,100) });
    res.json({ answer: outputCheck.sanitized, warnings: outputCheck.warnings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI agent failed' });
  }
});

router.get('/security/audit', auth, async (req, res) => {
  const logs = civic.getAuditLog(req.userId);
  res.json({ logs });
});

module.exports = router;