import { WebComponent } from '@xaendar/core';
import { LabBase } from './base';

@WebComponent({ selector: 'lab-sub-a', templateUrl: './sub-a.xd.component.html' })
export class LabSubA extends LabBase {}

@WebComponent({ selector: 'lab-sub-b', templateUrl: './sub-a.xd.component.html' })
export class LabSubB extends LabSubA {
  public override inc(): void { super.inc(); super.inc(); }
}
