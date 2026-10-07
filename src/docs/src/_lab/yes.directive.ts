import { Directive, StructuralDirective } from '@xaendar/core';

@Directive({ selector: 'labYes' })
export class LabYesDirective extends StructuralDirective {
  public shouldRender(): boolean {
    return true;
  }
}
