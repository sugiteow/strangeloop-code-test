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
          {
            name: 'total revenue',
            value: '$22,496M (-12% YoY)',
            citation: {
              pageNumber: 1,
              sectionTitle: 'Financial Summary',
              paragraphNumber: undefined,
              lineNumber: undefined,
            },
          },
          {
            name: 'income from operations',
            value: '$923M (-42% YoY)',
            citation: {
              pageNumber: 1,
              sectionTitle: 'Financial Summary',
              paragraphNumber: undefined,
              lineNumber: undefined,
            },
          },
          {
            name: 'free cash flow',
            value: '$146M (-89% YoY)',
            citation: {
              pageNumber: 1,
              sectionTitle: 'Financial Summary',
              paragraphNumber: undefined,
              lineNumber: undefined,
            },
          },
          {
            name: 'eps diluted (gaap)',
            value: '$0.33 (-18% YoY)',
            citation: {
              pageNumber: 1,
              sectionTitle: 'Financial Summary',
              paragraphNumber: undefined,
              lineNumber: undefined,
            },
          },
        ];

        for (const expected of expectedMetrics) {
          const metric = result.keyMetrics.find((m) =>
            m.name.toLowerCase().includes(expected.name)
          );
          expect(metric).toBeDefined();
          expect(metric!.value).toContain(expected.value);
          expect(metric!.citation).toEqual(expected.citation);
        }
      });

      it('should include risks with citations from the document', () => {
        const findRisk = (keyword: string) =>
          result.risks.find((r) => r.text.toLowerCase().includes(keyword));

        const deliveryRisk = findRisk('deliver');
        expect(deliveryRisk).toBeDefined();
        expect(deliveryRisk!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'Revenue',
          paragraphNumber: 2,
          lineNumber: 1,
        });

        const revenueRisk = findRisk('revenue');
        expect(revenueRisk).toBeDefined();
        expect(revenueRisk!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'Revenue',
          paragraphNumber: 2,
          lineNumber: 1,
        });

        const tariffRisk = findRisk('tariff');
        expect(tariffRisk).toBeDefined();
        expect(tariffRisk!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'Profitability',
          paragraphNumber: 2,
          lineNumber: 6,
        });
      });

      it('should include opportunities with citations from the document', () => {
        const findOpportunity = (keyword: string) =>
          result.opportunities.find((o) => o.text.toLowerCase().includes(keyword));

        const serviceOpportunity = findOpportunity('service');
        expect(serviceOpportunity).toBeDefined();
        expect(serviceOpportunity!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'Revenue',
          paragraphNumber: 2,
          lineNumber: 5,
        });

        const energyOpportunity = findOpportunity('energy');
        expect(energyOpportunity).toBeDefined();
        expect(energyOpportunity!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'Profitability',
          paragraphNumber: 2,
          lineNumber: 7,
        });

        const costOpportunity = findOpportunity('cost');
        expect(costOpportunity).toBeDefined();
        expect(costOpportunity!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'Profitability',
          paragraphNumber: 2,
          lineNumber: 6,
        });
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
          {
            name: 'net income',
            value: '$4.1 billion',
            citation: { pageNumber: 1, sectionTitle: 'PRESENTATION', paragraphNumber: 6 },
          },
          {
            name: 'eps',
            value: '$1.96',
            citation: { pageNumber: 1, sectionTitle: 'PRESENTATION', paragraphNumber: 6 },
          },
          {
            name: 'revenue',
            value: '$21.6 billion',
            citation: { pageNumber: 3, sectionTitle: 'PRESENTATION', paragraphNumber: 2 },
          },
          {
            name: 'expenses',
            value: '$13.4 billion',
            citation: { pageNumber: 3, sectionTitle: 'PRESENTATION', paragraphNumber: 2 },
          },
          {
            name: 'cet1',
            value: '13.4%',
            citation: { pageNumber: 2, sectionTitle: 'PRESENTATION', paragraphNumber: 4 },
          },
        ];

        for (const expected of expectedMetrics) {
          const metric = result.keyMetrics.find((m) =>
            m.name.toLowerCase().includes(expected.name)
          );
          expect(metric).toBeDefined();
          expect(metric!.value).toContain(expected.value);
          expect(metric!.citation).toEqual(expect.objectContaining(expected.citation));
        }
      });

      it('should include risks with citations from the document', () => {
        const findRisk = (keyword: string) =>
          result.risks.find((r) => r.text.toLowerCase().includes(keyword));

        const macroRisk = findRisk('macro');
        expect(macroRisk).toBeDefined();
        expect(macroRisk!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'PRESENTATION',
          paragraphNumber: 7,
          lineNumber: 1,
        });

        const tariffRisk = findRisk('tariff');
        expect(tariffRisk).toBeDefined();
        expect(tariffRisk!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'PRESENTATION',
          paragraphNumber: 7,
          lineNumber: 1,
        });

        const uncertaintyRisk = findRisk('uncertainty');
        expect(uncertaintyRisk).toBeDefined();
        expect(uncertaintyRisk!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'PRESENTATION',
          paragraphNumber: 7,
          lineNumber: 1,
        });
      });

      it('should include opportunities with citations from the document', () => {
        const findOpportunity = (keyword: string) =>
          result.opportunities.find((o) => o.text.toLowerCase().includes(keyword));

        const wealthOpportunity = findOpportunity('wealth');
        expect(wealthOpportunity).toBeDefined();
        expect(wealthOpportunity!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'PRESENTATION',
          paragraphNumber: 1,
          lineNumber: 1,
        });

        const bankingOpportunity = findOpportunity('banking');
        expect(bankingOpportunity).toBeDefined();
        expect(bankingOpportunity!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'PRESENTATION',
          paragraphNumber: 6,
          lineNumber: 1,
        });

        const marketOpportunity = findOpportunity('market');
        expect(marketOpportunity).toBeDefined();
        expect(marketOpportunity!.citation).toEqual({
          pageNumber: 2,
          sectionTitle: 'PRESENTATION',
          paragraphNumber: 11,
          lineNumber: 1,
        });
      });
    });
  });
});
