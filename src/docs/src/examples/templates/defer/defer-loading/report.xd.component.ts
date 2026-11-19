import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The report. Only the content of a `@defer` renders it, so its module is loaded when the `@defer` needs it, not with
 * the page.
 */
@WebComponent({
  selector: 'ex-report',
  templateUrl: './report.xd.component.html'
})
export class ReportComponent extends CustomElement {}
