import {
  FinancialAnalysisResult,
  FinancialAnalystAgent,
} from '@src/ingestion/agent/FinancialAnalystAgent';

const TEST_FINANCIAL_UPDATE_PDF = './test/ingestion/agent/test-financial-update.pdf';
const TEST_EARNINGS_CALL_PDF = './test/ingestion/agent/test-earning-call-transcript.pdf';

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

      it('should identify the company and reporting period', () => {
        expect(result.companyName).toBe('Tesla, Inc.');
        expect(result.reportingPeriod).toBe('Q2 2025');
      });

      it('should include a financial health score with all dimensions between 1 and 5', () => {
        expect(result.score.profitability).toBeGreaterThanOrEqual(1);
        expect(result.score.profitability).toBeLessThanOrEqual(5);
        expect(result.score.growth).toBeGreaterThanOrEqual(1);
        expect(result.score.growth).toBeLessThanOrEqual(5);
        expect(result.score.efficiency).toBeGreaterThanOrEqual(1);
        expect(result.score.efficiency).toBeLessThanOrEqual(5);
        expect(result.score.overall).toBeGreaterThanOrEqual(1);
        expect(result.score.overall).toBeLessThanOrEqual(5);
      });

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
            value: /\$22,496\s*(M|million)/i,
            citation: {
              pageNumber: expect.any(Number),
              sectionTitle: expect.stringContaining('Financial Summary'),
              paragraphNumber: undefined,
            },
          },
          {
            name: 'income from operations',
            value: /\$923\s*(M|million)/i,
            citation: {
              pageNumber: expect.any(Number),
              sectionTitle: expect.stringContaining('Financial Summary'),
              paragraphNumber: undefined,
            },
          },
          {
            name: 'free cash flow',
            value: /\$146\s*(M|million)/i,
            citation: {
              pageNumber: expect.any(Number),
              sectionTitle: expect.stringContaining('Financial Summary'),
              paragraphNumber: undefined,
            },
          },
          {
            name: 'eps diluted (gaap)',
            value: '$0.33',
            citation: {
              pageNumber: expect.any(Number),
              sectionTitle: expect.stringContaining('Financial Summary'),
              paragraphNumber: undefined,
            },
          },
        ];

        for (const expected of expectedMetrics) {
          const metric = result.keyMetrics.find((m) =>
            m.name.toLowerCase().includes(expected.name)
          );
          expect(metric).toBeDefined();
          expect(metric!.value).toMatch(expected.value);
          expect(metric!.citation).toEqual(expected.citation);
        }
      });

      it('should include scale information in all key metric values', () => {
        const scalePattern = /\$|[0-9]M\b|[0-9]B\b|billion|million|%|bp/i;
        for (const metric of result.keyMetrics) {
          expect(metric.value).toMatch(scalePattern);
        }
      });

      it('should include risks with citations from the document', () => {
        const findRisk = (keyword: string) =>
          result.risks.find((r) => r.text.toLowerCase().includes(keyword));

        const deliveryRisk = findRisk('deliver');
        expect(deliveryRisk).toBeDefined();
        expect(deliveryRisk!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('Revenue'),
          paragraphNumber: expect.any(Number),
        });

        const revenueRisk = findRisk('revenue');
        expect(revenueRisk).toBeDefined();
        expect(revenueRisk!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('Revenue'),
          paragraphNumber: expect.any(Number),
        });

        const tariffRisk = findRisk('tariff');
        expect(tariffRisk).toBeDefined();
        expect(tariffRisk!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('Profitability'),
          paragraphNumber: expect.any(Number),
        });
      });

      it('should include opportunities with citations from the document', () => {
        const findOpportunity = (keyword: string) =>
          result.opportunities.find((o) => o.text.toLowerCase().includes(keyword));

        const energyOpportunity = findOpportunity('energy');
        expect(energyOpportunity).toBeDefined();
        expect(energyOpportunity!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('Profitability'),
          paragraphNumber: expect.any(Number),
        });

        const costOpportunity = findOpportunity('cost');
        expect(costOpportunity).toBeDefined();
        expect(costOpportunity!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('Profitability'),
          paragraphNumber: expect.any(Number),
        });
      });
    });

    describe('when analysing earnings call transcript', () => {
      beforeAll(async () => {
        const agent = new FinancialAnalystAgent();
        result = await agent.analyseFile(TEST_EARNINGS_CALL_PDF);
      }, 60000);

      it('should identify the company and reporting period', () => {
        expect(result.companyName).toBe('Citigroup Inc.');
        expect(result.reportingPeriod).toBe('Q1 2025');
      });

      it('should include a financial health score with all dimensions between 1 and 5', () => {
        expect(result.score.profitability).toBeGreaterThanOrEqual(1);
        expect(result.score.profitability).toBeLessThanOrEqual(5);
        expect(result.score.growth).toBeGreaterThanOrEqual(1);
        expect(result.score.growth).toBeLessThanOrEqual(5);
        expect(result.score.efficiency).toBeGreaterThanOrEqual(1);
        expect(result.score.efficiency).toBeLessThanOrEqual(5);
        expect(result.score.overall).toBeGreaterThanOrEqual(1);
        expect(result.score.overall).toBeLessThanOrEqual(5);
      });

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
            value: /\$4\.1\s*(B|billion)/i,
            citation: { pageNumber: expect.any(Number), sectionTitle: expect.stringContaining('PRESENTATION'), paragraphNumber: expect.any(Number) },
          },
          {
            name: 'eps',
            value: '$1.96',
            citation: { pageNumber: expect.any(Number), sectionTitle: expect.stringContaining('PRESENTATION'), paragraphNumber: expect.any(Number) },
          },
          {
            name: 'revenue',
            value: /\$21\.6\s*(B|billion)/i,
            citation: { pageNumber: expect.any(Number), sectionTitle: expect.stringContaining('PRESENTATION'), paragraphNumber: expect.any(Number) },
          },
          {
            name: 'expenses',
            value: /\$13\.4\s*(B|billion)/i,
            citation: { pageNumber: expect.any(Number), sectionTitle: expect.stringContaining('PRESENTATION'), paragraphNumber: expect.any(Number) },
          },
          {
            name: 'cet1',
            value: '13.4%',
            citation: { pageNumber: expect.any(Number), sectionTitle: expect.stringContaining('PRESENTATION'), paragraphNumber: expect.any(Number) },
          },
        ];

        for (const expected of expectedMetrics) {
          const metric = result.keyMetrics.find((m) =>
            m.name.toLowerCase().includes(expected.name)
          );
          expect(metric).toBeDefined();
          expect(metric!.value).toMatch(expected.value);
          expect(metric!.citation).toEqual(expect.objectContaining(expected.citation));
        }
      });

      it('should include scale information in all key metric values', () => {
        const scalePattern = /\$|[0-9]M\b|[0-9]B\b|billion|million|%|bp/i;
        for (const metric of result.keyMetrics) {
          expect(metric.value).toMatch(scalePattern);
        }
      });

      it('should include risks with citations from the document', () => {
        const findRisk = (keyword: string) =>
          result.risks.find((r) => r.text.toLowerCase().includes(keyword));

        const macroRisk = findRisk('macro');
        expect(macroRisk).toBeDefined();
        expect(macroRisk!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('PRESENTATION'),
          paragraphNumber: expect.any(Number),
        });

        const tariffRisk = findRisk('tariff');
        expect(tariffRisk).toBeDefined();
        expect(tariffRisk!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('PRESENTATION'),
          paragraphNumber: expect.any(Number),
        });

        const uncertaintyRisk = findRisk('uncertainty');
        expect(uncertaintyRisk).toBeDefined();
        expect(uncertaintyRisk!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('PRESENTATION'),
          paragraphNumber: expect.any(Number),
        });
      });

      it('should include opportunities with citations from the document', () => {
        const findOpportunity = (keyword: string) =>
          result.opportunities.find((o) => o.text.toLowerCase().includes(keyword));

        const wealthOpportunity = findOpportunity('wealth');
        expect(wealthOpportunity).toBeDefined();
        expect(wealthOpportunity!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('PRESENTATION'),
          paragraphNumber: expect.any(Number),
        });

        const bankingOpportunity = findOpportunity('banking');
        expect(bankingOpportunity).toBeDefined();
        expect(bankingOpportunity!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('PRESENTATION'),
          paragraphNumber: expect.any(Number),
        });

        const marketOpportunity = findOpportunity('market');
        expect(marketOpportunity).toBeDefined();
        expect(marketOpportunity!.citation).toEqual({
          pageNumber: expect.any(Number),
          sectionTitle: expect.stringContaining('PRESENTATION'),
          paragraphNumber: expect.any(Number),
        });
      });
    });
  });
});
