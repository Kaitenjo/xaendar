import { afterEach, describe, expect, it } from 'vitest';
import { TaskBoardComponent } from './task-board.xd.component';

/**
 * Waits for the effects, which run again in a microtask.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the example in the document.
 */
function mount(): TaskBoardComponent {
  const element = document.createElement('ex-task-board');
  if (!(element instanceof TaskBoardComponent)) {
    throw new Error('ex-task-board is not defined');
  }

  document.body.append(element);
  return element;
}

/**
 * The classes of the list and of its rows.
 */
function classesOf(element: TaskBoardComponent): string[] {
  const list = element.shadowRoot!.querySelector('ul')!;
  return [list.className].concat(Array.from(list.querySelectorAll('li'), row => row.className));
}

describe('TaskBoardComponent', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('gives the list the class of a string and each row the classes of an object, next to its own', () => {
    const element = mount();

    expect(classesOf(element)).toEqual(['tasks comfortable', 'task done', 'task selected urgent', 'task']);
  });

  it('removes the classes a value no longer holds and adds the new ones', async () => {
    const element = mount();
    element.select(3);
    element.toggle(1);
    element.toggleDensity();
    await flush();

    expect(classesOf(element)).toEqual(['tasks compact', 'task', 'task urgent', 'task selected']);
  });
});
