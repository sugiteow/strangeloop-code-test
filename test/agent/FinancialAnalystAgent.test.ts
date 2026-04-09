import {
  FinancialAnalysisResult,
  FinancialAnalystAgent,
} from '../../src/ai-client/agent/FinancialAnalystAgent';

const TEST_FINANCIAL_UPDATE_PDF = './test/agent/test-financial-update.pdf';
const TEST_EARNINGS_CALL_PDF = './test/agent/test-earning-call-transcript.pdf';

/*
 * Probably a bit too expensive to run this all the time. In real world, this should probably run
 * as some sort of smoke test.
 */
describe('FinancialAnalystAgent (integration)', () => {
  let result: FinancialAnalysisResult;

  describe('analyseFile', () => {
    describe('when analysing financial update document', () => {
      beforeAll(async () => {
        const agent = new FinancialAnalystAgent();
        result = await agent.analyseFile(TEST_FINANCIAL_UPDATE_PDF);
      }, 60000);

      it('summary references Tesla or key financial terms', () => {
        const summaryLower = result.summary.toLowerCase();
        expect(
          summaryLower.includes('tesla') ||
            summaryLower.includes('revenue') ||
            summaryLower.includes('q2')
        ).toBe(true);
      });

      it('should include key metrics from the document', () => {
        const expectedMetrics = [
          { name: 'total revenue', value: '$22,496M (-12% YoY)' },
          { name: 'income from operations', value: '$923M (-42% YoY)' },
          { name: 'free cash flow', value: '$146M (-89% YoY)' },
          { name: 'eps diluted (gaap)', value: '$0.33 (-18% YoY)' },
        ];

        for (const expected of expectedMetrics) {
          const metric = result.keyMetrics.find((m) =>
            m.name.toLowerCase().includes(expected.name)
          );
          expect(metric).toBeDefined();
          expect(metric!.value).toBe(expected.value);
        }
      });

      it('should include risks summary from the document', () => {
        const risksText = result.risks.join(' ').toLowerCase();
        const expectedRisks = ['deliver', 'revenue', 'tariff'];
        for (const risk of expectedRisks) {
          expect(risksText.includes(risk)).toBe(true);
        }
      });

      it('should include opportunities summary from the document', () => {
        const opportunitiesText = result.opportunities.join(' ').toLowerCase();
        const expectedOpportunities = ['service', 'energy', 'cost'];
        for (const opportunity of expectedOpportunities) {
          expect(opportunitiesText.includes(opportunity)).toBe(true);
        }
      });
    });

    describe('when analysing earnings call transcript', () => {
      beforeAll(async () => {
        const agent = new FinancialAnalystAgent();
        result = await agent.analyseFile(TEST_EARNINGS_CALL_PDF);
      }, 60000);

      it('summary references Citi or key financial terms', () => {
        const summaryLower = result.summary.toLowerCase();
        expect(
          summaryLower.includes('citi') ||
            summaryLower.includes('revenue') ||
            summaryLower.includes('q1')
        ).toBe(true);
      });

      it('should include key metrics from the document', () => {
        const expectedMetrics = [
          { name: 'net income', value: '$4.1 billion' },
          { name: 'eps', value: '$1.96' },
          { name: 'revenue', value: '$21.6 billion (up 3% YoY)' },
          { name: 'expenses', value: '$13.4 billion (down 5% YoY)' },
          { name: 'cet1', value: '13.4% (preliminary)' },
        ];

        for (const expected of expectedMetrics) {
          const metric = result.keyMetrics.find((m) =>
            m.name.toLowerCase().includes(expected.name)
          );
          expect(metric).toBeDefined();
          expect(metric!.value).toBe(expected.value);
        }
      });

      it('should include risks from the document', () => {
        const risksText = result.risks.join(' ').toLowerCase();
        const expectedRisks = ['macro', 'tariff', 'uncertainty'];
        for (const risk of expectedRisks) {
          expect(risksText.includes(risk)).toBe(true);
        }
      });

      it('should include opportunities from the document', () => {
        const opportunitiesText = result.opportunities.join(' ').toLowerCase();
        const expectedOpportunities = ['wealth', 'banking', 'market'];
        for (const opportunity of expectedOpportunities) {
          expect(opportunitiesText.includes(opportunity)).toBe(true);
        }
      });
    });
  });
});
