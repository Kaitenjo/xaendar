import type { ApiPackage } from '../api.data';
import { DEFER_TESTING } from '../../../templates/defer/defer.snippets';

/**
 * The symbols of `@xaendar/core/testing`.
 */
export const CORE_TESTING_API: ApiPackage = {
  name: '@xaendar/core/testing',
  symbols: [
    {
      name: 'getDeferBlocks',
      kind: 'function',
      signature: 'function getDeferBlocks(host: Element): DeferBlockFixture[]',
      members: [
        {
          name: 'host',
          group: 'parameters',
          signature: 'host: Element'
        }
      ],
      usage: [
        { key: 'drivingByHand', snippets: [DEFER_TESTING] }
      ],
      guides: ['templates/defer']
    },
    {
      name: 'setDeferBlockBehavior',
      kind: 'function',
      signature: 'function setDeferBlockBehavior(value: DeferBlockBehavior): void',
      members: [
        {
          name: 'value',
          group: 'parameters',
          signature: 'value: DeferBlockBehavior'
        }
      ],
      guides: ['templates/defer']
    },
    {
      name: 'DeferBlockFixture',
      kind: 'type',
      signature: 'type DeferBlockFixture = {\n  readonly state: DeferBlockState;\n  render(state: DeferBlockState, error?: unknown): Promise<void>;\n};',
      members: [
        {
          name: 'state',
          group: 'properties',
          signature: 'readonly state: DeferBlockState'
        },
        {
          name: 'render',
          group: 'methods',
          signature: 'render(state: DeferBlockState, error?: unknown): Promise<void>'
        }
      ],
      guides: ['templates/defer']
    },
    {
      name: 'DeferBlockState',
      kind: 'type',
      signature: 'type DeferBlockState = \'placeholder\' | \'loading\' | \'complete\' | \'error\';',
      guides: ['templates/defer']
    },
    {
      name: 'DeferBlockBehavior',
      kind: 'type',
      signature: 'type DeferBlockBehavior = \'playthrough\' | \'manual\';',
      guides: ['templates/defer']
    }
  ]
};
