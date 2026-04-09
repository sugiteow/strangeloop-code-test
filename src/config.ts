export const config = {
  // in real deployed environment, the api key will be hidden inside an env. var, but as we don't use any deployment environment
  // for the purpose of this code test, I'll just hardcode the real api key here.  Will remove
  // the key once the code interview process is done.
  apiKey: process.env.ANTHROPIC_API_KEY ?? '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',
  model: process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-6',
  maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS ?? '16000', 10),
};
