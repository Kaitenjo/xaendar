import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { XaendarPluginState } from '../../types/plugin.types';

vi.mock('@xaendar/language-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xaendar/language-core')>();
  return {
    ...actual,
    removeRealFile: vi.fn(),
    removeVirtualFile: vi.fn()
  };
});

vi.mock('../../registry/import-registry/import-registry', () => ({
  clearImportToComponents: vi.fn(),
  clearComponentToImports: vi.fn(),
  findComponentsForImport: vi.fn()
}));

vi.mock('../../registry/metadata-registry/metadata-registry', () => ({
  clearMetadataForFile: vi.fn()
}));

vi.mock('../../registry/style-registry/style-registry', () => ({
  clearStyleDependenciesForComponent: vi.fn(),
  findComponentPathsForStyleDependency: vi.fn()
}));

vi.mock('../../registry/template-registry/template-registry', () => ({
  findComponentPathsForTemplate: vi.fn(),
  removeComponentPath: vi.fn()
}));

import { removeRealFile, removeVirtualFile } from '@xaendar/language-core';
import { PluginContext } from 'rolldown';
import { clearComponentToImports, clearImportToComponents, findComponentsForImport } from '../../registry/import-registry/import-registry';
import { clearMetadataForFile } from '../../registry/metadata-registry/metadata-registry';
import { clearStyleDependenciesForComponent, findComponentPathsForStyleDependency } from '../../registry/style-registry/style-registry';
import { findComponentPathsForTemplate, removeComponentPath } from '../../registry/template-registry/template-registry';
import { createWatchChangeHook, handleHtmlDelete, handleStyleDelete, handleTsDelete } from './watch-change';

function createState(): XaendarPluginState {
  return {
    host: {} as XaendarPluginState['host'],
    compilerOptions: {} as XaendarPluginState['compilerOptions'],
    setLogger: vi.fn(),
    logError: vi.fn()
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleTsDelete()', () => {
  it('tears down every registry entry for the deleted component', () => {
    const state = createState();
    vi.mocked(findComponentsForImport).mockReturnValue(new Set());

    handleTsDelete('/src/foo.xd.component.ts', state);

    expect(removeVirtualFile).toHaveBeenCalledWith('/src/foo.xd.component.ts.__typecheck__.ts');
    expect(removeRealFile).toHaveBeenCalledWith('/src/foo.xd.component.ts');
    expect(removeComponentPath).toHaveBeenCalledWith('/src/foo.xd.component.ts');
    expect(clearStyleDependenciesForComponent).toHaveBeenCalledWith('/src/foo.xd.component.ts');
    expect(clearMetadataForFile).toHaveBeenCalledWith('/src/foo.xd.component.ts');
    expect(clearImportToComponents).toHaveBeenCalledWith('/src/foo.xd.component.ts');
    expect(clearComponentToImports).toHaveBeenCalledWith('/src/foo.xd.component.ts');
    expect(state.logError).not.toHaveBeenCalled();
  });

  it('invalidates and warns every component that still imports the deleted file', () => {
    const state = createState();
    vi.mocked(findComponentsForImport).mockReturnValue(new Set(['/src/a.xd.component.ts', '/src/b.xd.component.ts']));

    handleTsDelete('/src/foo.xd.component.ts', state);

    expect(removeVirtualFile).toHaveBeenCalledWith('/src/a.xd.component.ts.__typecheck__.ts');
    expect(removeVirtualFile).toHaveBeenCalledWith('/src/b.xd.component.ts.__typecheck__.ts');
    expect(state.logError).toHaveBeenCalledWith('', 'Component "/src/foo.xd.component.ts" was deleted but is still imported by "/src/a.xd.component.ts". Update its @import statement.');
    expect(state.logError).toHaveBeenCalledWith('', 'Component "/src/foo.xd.component.ts" was deleted but is still imported by "/src/b.xd.component.ts". Update its @import statement.');
  });
});

describe('handleHtmlDelete()', () => {
  it('does nothing when no component references the deleted template', () => {
    vi.mocked(findComponentPathsForTemplate).mockReturnValue(undefined);

    handleHtmlDelete('/src/foo.xd.component.html');

    expect(removeVirtualFile).not.toHaveBeenCalled();
  });

  it('removes the virtual shim for every component referencing the deleted template', () => {
    vi.mocked(findComponentPathsForTemplate).mockReturnValue(new Set(['/src/foo.xd.component.ts']));

    handleHtmlDelete('/src/foo.xd.component.html');

    expect(removeVirtualFile).toHaveBeenCalledWith('/src/foo.xd.component.ts.__typecheck__.ts');
  });
});

describe('handleStyleDelete()', () => {
  it('does nothing when no component depends on the deleted stylesheet', () => {
    vi.mocked(findComponentPathsForStyleDependency).mockReturnValue(undefined);

    handleStyleDelete('/src/foo.css');

    expect(removeVirtualFile).not.toHaveBeenCalled();
  });

  it('removes the virtual shim for every component depending on the deleted stylesheet', () => {
    vi.mocked(findComponentPathsForStyleDependency).mockReturnValue(new Set(['/src/foo.xd.component.ts']));

    handleStyleDelete('/src/foo.css');

    expect(removeVirtualFile).toHaveBeenCalledWith('/src/foo.xd.component.ts.__typecheck__.ts');
  });
});

describe('createWatchChangeHook()', () => {
  it('ignores change events other than "delete"', () => {
    const state = createState();
    const hook = createWatchChangeHook(state);
    vi.mocked(findComponentsForImport).mockReturnValue(new Set());

    hook.call({} as PluginContext, '/src/foo.xd.component.ts', { event: 'create' });

    expect(removeRealFile).not.toHaveBeenCalled();
  });

  it('dispatches to the TS-delete handler for component TS files', () => {
    const state = createState();
    const hook = createWatchChangeHook(state);
    vi.mocked(findComponentsForImport).mockReturnValue(new Set());

    hook.call({} as PluginContext, '/src/foo.xd.component.ts', { event: 'delete' });

    expect(removeRealFile).toHaveBeenCalledWith('/src/foo.xd.component.ts');
  });

  it('dispatches to the HTML-delete handler for component template files', () => {
    const state = createState();
    const hook = createWatchChangeHook(state);
    vi.mocked(findComponentPathsForTemplate).mockReturnValue(undefined);

    hook.call({} as PluginContext, '/src/foo.xd.component.html', { event: 'delete' });

    expect(removeRealFile).not.toHaveBeenCalled();
    expect(findComponentPathsForTemplate).toHaveBeenCalledWith('/src/foo.xd.component.html');
  });

  it('dispatches to the style-delete handler for any other deleted file', () => {
    const state = createState();
    const hook = createWatchChangeHook(state);
    vi.mocked(findComponentPathsForStyleDependency).mockReturnValue(undefined);

    hook.call({} as PluginContext, '/src/foo.css', { event: 'delete' });

    expect(findComponentPathsForStyleDependency).toHaveBeenCalledWith('/src/foo.css');
  });
});
