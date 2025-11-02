import { BaseWebComponent } from "@xendar/core";
import { WebComponent } from "./web-component.decorator";

describe('WebComponent decorator', () => {
  let defineSpy: jest.SpyInstance;

  beforeEach(() => defineSpy = jest.spyOn(customElements, 'define').mockImplementation(() => { }));

  afterEach(() => defineSpy.mockRestore());

  it('should define a web component with a single selector', () => {
    @WebComponent('single-selector')
    class SingleSelectorComponent extends BaseWebComponent {
      public template(): string {
        throw new Error("Method not implemented.");
      }
      public css(): string {
        throw new Error("Method not implemented.");
      }
    }

    expect(defineSpy).toHaveBeenCalledTimes(1);
    expect(defineSpy).toHaveBeenCalledWith('single-selector', SingleSelectorComponent);
  });

  it('should define a web component with multiple selectors', () => {
    @WebComponent(['first-selector', 'second-selector'])
    class MultipleSelectorComponent extends BaseWebComponent {
      public template(): string {
        throw new Error("Method not implemented.");
      }
      public css(): string {
        throw new Error("Method not implemented.");
      }
    }

    expect(defineSpy).toHaveBeenCalledTimes(2);
    expect(defineSpy).toHaveBeenNthCalledWith(1, 'first-selector', MultipleSelectorComponent);
    expect(defineSpy).toHaveBeenNthCalledWith(2, 'second-selector', MultipleSelectorComponent);
  });

  it.skip('should define a web component with multiple selectors', () => {
    @WebComponent('selector')
    class SingleSelectorComponent extends BaseWebComponent {
      public template(): string {
        throw new Error("Method not implemented.");
      }
      public css(): string {
        throw new Error("Method not implemented.");
      }
    }

    expect(defineSpy).toHaveBeenCalledTimes(2);
    expect(defineSpy).toHaveBeenNthCalledWith(1, 'first-selector', SingleSelectorComponent);
    expect(defineSpy).toHaveBeenNthCalledWith(2, 'second-selector', SingleSelectorComponent);
  });
});
