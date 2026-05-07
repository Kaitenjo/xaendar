import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { BaseWebComponent } from '../../directives/base-web-component';
import { WebComponent } from './web-component.decorator';

describe('WebComponent decorator', () => {
  let defineSpy: Mock;

  beforeEach(() => defineSpy = vi.spyOn(customElements, 'define').mockImplementation(() => { }));

  afterEach(() => defineSpy.mockRestore());

  it('should define a web component with a single selector', () => {
    @WebComponent({
      selector: 'single-selector',
      templateUrl: 'template.html',
    })
    class SingleSelectorComponent extends BaseWebComponent {
      public template(): string {
        throw new Error('Method not implemented.');
      }
      public css(): string {
        throw new Error('Method not implemented.');
      }
    }

    expect(defineSpy).toHaveBeenCalledTimes(1);
    expect(defineSpy).toHaveBeenCalledWith('single-selector', SingleSelectorComponent);
  });

  it('should define a web component with multiple selectors', () => {
    @WebComponent({
      selector: ['first-selector', 'second-selector'],
      templateUrl: 'template.html',
    })
    class MultipleSelectorComponent extends BaseWebComponent {
      public template(): string {
        throw new Error('Method not implemented.');
      }
      public css(): string {
        throw new Error('Method not implemented.');
      }
    }

    expect(defineSpy).toHaveBeenCalledTimes(2);
    expect(defineSpy).toHaveBeenNthCalledWith(1, 'first-selector', MultipleSelectorComponent);
    expect(defineSpy).toHaveBeenNthCalledWith(2, 'second-selector', MultipleSelectorComponent);
  });

  it('should define a web component with multiple selectors', () => {
    @WebComponent({
      selector: 'selector',
      templateUrl: 'template.html',
    })
    class SingleSelectorComponent extends BaseWebComponent {
      public template(): string {
        throw new Error('Method not implemented.');
      }
      public css(): string {
        throw new Error('Method not implemented.');
      }
    }

    expect(defineSpy).toHaveBeenCalledTimes(2);
    expect(defineSpy).toHaveBeenNthCalledWith(1, 'first-selector', SingleSelectorComponent);
    expect(defineSpy).toHaveBeenNthCalledWith(2, 'second-selector', SingleSelectorComponent);
  });
});
