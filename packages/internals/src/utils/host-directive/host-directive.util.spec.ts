import { describe, expect, it } from 'vitest';
import { describeDuplicateHostDirective, describeEventExposure, describeInputExposure } from './host-directive.util';

describe('describeDuplicateHostDirective', () => {
  it('names the component and the directive', () => {
    expect(describeDuplicateHostDirective('MyEl', 'Tooltip')).toBe('MyEl declares the host directive Tooltip more than once');
  });
});

describe('describeInputExposure', () => {
  it('accepts an input the directive declares, named apart from the inputs and the members of the component', () => {
    expect(describeInputExposure(true, false, false, 'text', 'label', 'MyEl', 'Tooltip')).toBeUndefined();
  });

  it('reports an input the directive does not declare first, by its name in the directive', () => {
    expect(describeInputExposure(false, true, true, 'text', 'label', 'MyEl', 'Tooltip')).toBe('Tooltip does not declare an input named "text"');
  });

  it('reports a name taken by an input before one taken by a member, by the name it is exposed with', () => {
    expect(describeInputExposure(true, true, true, 'text', 'label', 'MyEl', 'Tooltip')).toBe('MyEl already has an input named "label", which Tooltip cannot expose');
    expect(describeInputExposure(true, false, true, 'text', 'label', 'MyEl', 'Tooltip')).toBe('MyEl already has a member named "label", which Tooltip cannot expose as an input');
  });
});

describe('describeEventExposure', () => {
  it('accepts an event the directive declares, named apart from the events of the component', () => {
    expect(describeEventExposure(true, false, 'opened', 'shown', 'MyEl', 'Tooltip')).toBeUndefined();
  });

  it('reports an event the directive does not declare first, then a name taken by an event', () => {
    expect(describeEventExposure(false, true, 'opened', 'shown', 'MyEl', 'Tooltip')).toBe('Tooltip does not declare an event named "opened"');
    expect(describeEventExposure(true, true, 'opened', 'shown', 'MyEl', 'Tooltip')).toBe('MyEl already has an event named "shown", which Tooltip cannot expose');
  });
});
