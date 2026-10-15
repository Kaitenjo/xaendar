import { describe, expect, it } from 'vitest';
import { SwitchButtonComponent } from './switch-button.xd.component';

describe('SwitchButtonComponent', () => {
  it('renders its template', () => {
    const element = document.createElement('switch-button');
    document.body.append(element);

    expect(element).toBeInstanceOf(SwitchButtonComponent);
    expect(element.shadowRoot?.textContent).toContain('switch-button works!');
    element.remove();
  });
});
