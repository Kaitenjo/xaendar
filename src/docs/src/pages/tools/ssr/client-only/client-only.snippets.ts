import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet of a component only the browser renders, shown by the page tools/ssr/client-only.
 */
export const CLIENT_ONLY_COMPONENT: SourceFile = {
  name: 'sales-chart.xd.component.ts',
  lang: 'ts',
  code: `import { CustomElement, WebComponent } from '@xaendar/core';
// Reads window when it is imported: the server does not load this module for the templates rendering the component
import { Chart } from 'chart-library';

@WebComponent({
  selector: 'app-sales-chart',
  ssr: { render: false },
  templateUrl: './sales-chart.xd.component.html'
})
export class SalesChartComponent extends CustomElement { }`
};
