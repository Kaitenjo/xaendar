import { describe, expect, it } from 'vitest';
import { parseTemplate } from '../../../compile/compile';
import type { ElementNode } from '../../../parser/types/nodes/element-node.type';
import { getTextSeparators } from './text-separators.utils';

describe('getTextSeparators()', () => {
  it('separates each interpolation, and a text or a @render following a text', () => {
    const nodes = parseTemplate('Hi { name }!<b>x</b>tail @render row()');

    expect(getTextSeparators(nodes, undefined, 'html')).toEqual([false, true, true, false, false, true]);
  });

  it('does not separate a text following an element or a block', () => {
    const nodes = parseTemplate('<b>x</b>tail@if (a) { y }after');

    expect(getTextSeparators(nodes, undefined, 'html')).toEqual([false, false, false, false]);
  });

  it('looks across the nodes rendering nothing, which two texts around them follow each other across', () => {
    const nodes = parseTemplate('a@let b = 1;c');

    expect(getTextSeparators(nodes, undefined, 'html')).toEqual([false, false, true]);
  });

  it('separates nothing where the parser reads the content of the element as text', () => {
    const [textarea] = parseTemplate('<textarea>a{ b }c</textarea>') as ElementNode[];
    const [title] = parseTemplate('<title>{ b }</title>') as ElementNode[];
    const [style] = parseTemplate('<style>{ b }</style>') as ElementNode[];

    expect(getTextSeparators(textarea.children, 'textarea', 'html')).toEqual([false, false, false]);
    expect(getTextSeparators(title.children, 'title', 'html')).toEqual([false]);
    expect(getTextSeparators(style.children, 'style', 'html')).toEqual([false]);
  });

  it('separates the texts of an element of another namespace named like one reading its content as text', () => {
    const [svg] = parseTemplate('<svg><title>{ b }</title></svg>') as ElementNode[];
    const title = svg.children[0] as ElementNode;

    expect(getTextSeparators(title.children, 'title', 'svg')).toEqual([true]);
  });
});
