export async function batchProcess<TInput, TOutput>(
  items: TInput[],
  batchSize: number,
  process: (item: TInput, index: number) => Promise<TOutput>,
  onError: (reason: unknown) => void
): Promise<TOutput[]> {
  const results: TOutput[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((item, j) => process(item, i + j))
    );
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        onError(result.reason);
      }
    }
  }

  return results;
}
