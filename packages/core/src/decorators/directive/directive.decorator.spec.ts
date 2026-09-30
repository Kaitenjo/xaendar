import { Constructor } from '@xaendar/types';
import { describe, expect, it } from 'vitest';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { _getDirective } from '../../utils/directive-registry/directive-registry.util';
import { Directive } from './directive.decorator';

class TestDirective extends CustomDirective {
  public reactToChanges(): undefined {
    return;
  }
}

describe('Directive decorator', () => {
  it('registers the class under its selector', () => {
    Directive<TestDirective>({ selector: 'testDirective' })(TestDirective, {} as ClassDecoratorContext<Constructor<TestDirective>>);

    expect(_getDirective('testDirective')).toBe(TestDirective);
  });
});
