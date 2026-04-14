export const toRag = (score: number): string => {
  if (score <= 2) return '🔴';
  if (score === 3) return '🟡';
  return '🟢';
};
