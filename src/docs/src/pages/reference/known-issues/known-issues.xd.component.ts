import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Known issues" page, in English.
 */
@WebComponent({
  selector: 'page-reference-known-issues-en',
  templateUrl: './known-issues.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceKnownIssuesPageEn extends CustomElement {}

/**
 * The "Known issues" page, in Italian.
 */
@WebComponent({
  selector: 'page-reference-known-issues-it',
  templateUrl: './known-issues.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceKnownIssuesPageIt extends CustomElement {}
