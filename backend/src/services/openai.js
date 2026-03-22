const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askAgent(question, collection) {
  const collectionSummary = collection.map(c =>
    `${c.name} (${c.set}, ${c.rarity}, qty: ${c.quantity})`
  ).join('\n');

  const systemPrompt = `You are PokéAgent, a helpful assistant for Pokémon card collectors. The user has:\n${collectionSummary || 'No cards yet.'}\n\nAnswer questions about their collection, suggest trades, or give advice. Be concise and friendly.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  return response.choices[0].message.content;
}

module.exports = { askAgent };
