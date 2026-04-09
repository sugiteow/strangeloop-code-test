import { FinancialAnalystAgent } from '../../src/ai-client/agent/FinancialAnalystAgent';

const TEST_PDF = './test/agent/test-financial-update.pdf';

/*
 * Probably a bit too expensive to run this all the time. In real world, this should probably run
 * as some sort of smoke test.
 */
describe('FinancialAnalystAgent (integration)', () => {
  let agent: FinancialAnalystAgent;

  beforeAll(() => {
    agent = new FinancialAnalystAgent();
  });

  describe('analyseFile', () => {
    it('returns a structured financial analysis of financial-update document', async () => {
      const result = await agent.analyseFile(TEST_PDF);

      // Summary references Tesla or key financial terms
      const summaryLower = result.summary.toLowerCase();
      expect(
        summaryLower.includes('tesla') ||
          summaryLower.includes('revenue') ||
          summaryLower.includes('q2')
      ).toBe(true);

      // Key metrics include known figures from the document
      const expectedMetrics = [
        { name: 'revenue', value: '22,496' },
        { name: 'operating income', value: '923' },
        { name: 'free cash flow', value: '146' },
        { name: 'eps', value: '0.33' },
      ];

      for (const expected of expectedMetrics) {
        const metric = result.keyMetrics.find((m) => m.name.toLowerCase().includes(expected.name));
        expect(metric).toBeDefined();
        expect(metric!.value).toContain(expected.value);
      }

      // Risks mention key headwinds from the document
      const risksText = result.risks.join(' ').toLowerCase();
      const expectedRisks = ['deliver', 'revenue', 'tariff'];
      for (const risk of expectedRisks) {
        expect(risksText.includes(risk)).toBe(true);
      }

      // Opportunities mention key tailwinds from the document
      const opportunitiesText = result.opportunities.join(' ').toLowerCase();
      const expectedOpportunities = ['service', 'energy', 'cost'];
      for (const opportunity of expectedOpportunities) {
        expect(opportunitiesText.includes(opportunity)).toBe(true);
      }
    }, 60000);
  });
});
