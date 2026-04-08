export const config = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-6',
  maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS ?? '16000', 10),
};
