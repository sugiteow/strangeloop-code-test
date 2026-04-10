import {
  FinancialMetricNormaliserAgent,
  NormalisedFinancialMetrics,
} from '../../../src/transformation/agent/FinancialMetricNormaliserAgent';
import { scenarios } from './FinancialMetricNormaliserAgent.test-data';

describe('FinancialMetricNormaliserAgent (integration)', () => {
  describe('normalise', () => {
    describe.each(scenarios)('when given $name', ({ description, input, expected }) => {
      let result: NormalisedFinancialMetrics;

      beforeAll(async () => {
        const agent = new FinancialMetricNormaliserAgent();
        result = await agent.normalise(input);
      }, 60000);

      it(description, () => {
        expect(result).toEqual(expected);
      });
    });
  });
});
