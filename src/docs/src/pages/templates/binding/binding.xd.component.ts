import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Attribute and property binding" page.
 */
@WebComponent({
  selector: 'page-templates-binding',
  styleUrl: '../../page.css',
  templateUrl: './binding.xd.component.html'
})
export class TemplatesBindingPage extends CustomElement {
  a(x: CustomEvent<string>) {

  }

  b = 3
}
