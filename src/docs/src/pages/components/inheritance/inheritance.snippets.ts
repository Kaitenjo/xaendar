import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `manual-subclass.ts`, shown by the page components/inheritance and the API reference of core.
 */
export const MANUAL_SUBCLASS: SourceFile = {
  name: 'manual-subclass.ts',
  lang: 'ts',
  code: `/**
 * A subclass registered by hand, without @WebComponent: it has no render function of its own.
 */
class PlainStepper extends StepperComponent {}
customElements.define('plain-stepper', PlainStepper);

document.body.append(document.createElement('plain-stepper'));
// ✗ Error: PlainStepper does not seem to have a Render Function`
};

/**
 * The snippet `subclass-template.ts`, shown by the page components/inheritance.
 */
export const SUBCLASS_TEMPLATE: SourceFile = {
  name: 'subclass-template.ts',
  lang: 'ts',
  code: `/**
 * A decorated subclass: it gets its own render function, and can reuse the template of its parent.
 */
@WebComponent({
  selector: 'ex-big-stepper',
  styleUrl: './big-stepper.css',
  templateUrl: '../stepper/stepper.xd.component.html'
})
export class BigStepperComponent extends StepperComponent {}`
};
