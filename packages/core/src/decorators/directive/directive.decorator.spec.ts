import { Constructor } from '@xaendar/types';
import { describe, expect, it } from 'vitest';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { StructuralDirective } from '../../models/structural-directive/structural-directive';
import { _getDirective } from '../../utils/directive-registry/directive-registry.util';
import { Directive } from './directive.decorator';

class TestDirective extends CustomDirective {
  public onInit(): undefined {
    return;
  }
}

class TestStructuralDirective extends StructuralDirective {
  public shouldRender(): boolean {
    return true;
  }
}

describe('Directive decorator', () => {
  it('registers the class under its selector', () => {
    Directive<TestDirective>({ selector: 'testDirective' })(TestDirective, {} as ClassDecoratorContext<Constructor<TestDirective>>);

    expect(_getDirective('testDirective')).toBe(TestDirective);
  });

  it('registers a structural directive under its selector', () => {
    Directive<TestStructuralDirective>({ selector: 'testStructuralDirective' })(TestStructuralDirective, {} as ClassDecoratorContext<Constructor<TestStructuralDirective>>);

    expect(_getDirective('testStructuralDirective')).toBe(TestStructuralDirective);
  });
});
