const { OpenAI } = require('openai');

headers = {"Authorization": f"Bearer {os.environ['CIVIC_TOKEN']}"}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
export async function chatWithTools(messages: any[], civicToken: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const mcp = await createMCP(civicToken);
  const { tools } = await mcp.listTools();

  const toolDefs = tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));

  const toolDefs = tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));

  // Multi-turn tool loop — runs until the model stops requesting tools
  let response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    tools: toolDefs,
    tool_choice: 'auto',
  });

  while (response.choices[0]?.finish_reason === 'tool_calls') {
    const toolCalls = response.choices[0].message.tool_calls ?? [];
    const toolResults = await Promise.all(
      toolCalls.map(async (call) => {
        const args = JSON.parse(call.function.arguments || '{}');
        const result = await mcp.callTool({ name: call.function.name, arguments: args });
        return {
          role: 'tool' as const,
          tool_call_id: call.id,
          content: JSON.stringify(result.content),
        };
      })
    );

    messages = [
      ...messages,
      response.choices[0].message,
      ...toolResults,
    ];

    response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      tools: toolDefs,
    });
  }

  await mcp.close();
  return response;
}

import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function createMCP(token: string) {
  const transport = new StreamableHTTPClientTransport(
    new URL(process.env.CIVIC_URL!),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    }
  );
  const client = new Client(
    { name: 'PokeAgent', version: '1.0.0' },
    { capabilities: {} }
  );
  await client.connect(transport);
  return client;
}

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
