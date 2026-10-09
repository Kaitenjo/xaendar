import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Known issues" page.
 */
@WebComponent({
  selector: 'page-reference-known-issues',
  templateUrl: './known-issues.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceKnownIssuesPage extends CustomElement {}
