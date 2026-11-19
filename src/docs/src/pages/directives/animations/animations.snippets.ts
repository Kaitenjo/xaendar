import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `collapse.directive.ts`, shown by the page directives/animations and the API reference of core.
 */
export const LEAVE_HANDLER_DIRECTIVE: SourceFile = {
  name: 'collapse.directive.ts',
  lang: 'ts',
  code: `import { CustomDirective, Directive, onLeave } from '@xaendar/core';

/**
 * Collapses the element as it leaves: its height goes to zero, and the rows below it move up smoothly.
 */
@Directive({ 
  selector: 'exCollapse'
})
export class CollapseDirective extends CustomDirective<HTMLElement> {
  /**
   * Registers the exit while the directive starts, on its own element.
   */
  public onInit(): void {
    onLeave(this.element, element => {
      const height = \`\${element.getBoundingClientRect().height}px\`;
      // The element stays in the DOM until the promise settles: at most 5 seconds
      return element.animate([{ height, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 200, fill: 'forwards' })
        .finished.then(() => undefined);
    });
  }
}`
};
