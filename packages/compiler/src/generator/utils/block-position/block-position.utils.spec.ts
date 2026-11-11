import { describe, expect, it } from 'vitest';
import { parseTemplate } from '../../../compile/compile';
import { appendBlockPosition, getContentAnchor, isLastRenderedChild } from './block-position.utils';

describe('isLastRenderedChild', () => {
  it('is true for the last node, and for a node followed only by declarations rendering nothing', () => {
    const nodes = parseTemplate('<p></p>@if (a) { x }@let b = 1;<template t()>t</template>');

    expect(isLastRenderedChild(nodes, 1)).toBe(true);
    expect(isLastRenderedChild(nodes, 3)).toBe(true);
  });

  it('is false for a node followed by one rendering something', () => {
    const nodes = parseTemplate('@if (a) { x }@let b = 1;{ b }');

    expect(isLastRenderedChild(nodes, 0)).toBe(false);
    expect(isLastRenderedChild(parseTemplate('@for (item of items; track item) { x }@render t()<template t()>t</template>'), 0)).toBe(false);
  });
});

describe('getContentAnchor', () => {
  it('forwards the anchor of the block to its content, and none for the last block of its parent', () => {
    expect(getContentAnchor(false)).toBe('anchor');
    expect(getContentAnchor(true)).toBeUndefined();
  });
});

describe('appendBlockPosition', () => {
  it('appends last: true to the members of the last block of its parent', () => {
    const members = ['content: try0'];
    appendBlockPosition(members, true);

    expect(members).toEqual(['content: try0', 'last: true']);
  });

  it('leaves the members of any other block as they are', () => {
    const members = ['content: try0'];
    appendBlockPosition(members, false);

    expect(members).toEqual(['content: try0']);
  });
});
