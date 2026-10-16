import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Branching with @switch" page.
 */
@WebComponent({
  selector: 'page-templates-switch',
  styleUrl: '../../page.css',
  templateUrl: './switch.xd.component.html'
})
export class TemplatesSwitchPage extends CustomElement {}
