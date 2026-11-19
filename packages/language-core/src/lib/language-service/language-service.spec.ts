import type { CompilerOptions, LanguageService, LanguageServiceHost } from 'typescript';
import { describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  statSync: vi.fn()
}));

vi.mock('typescript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('typescript')>();
  return {
    ...actual,
    createLanguageService: vi.fn(),
    createDocumentRegistry: vi.fn(),
    getDefaultLibFilePath: vi.fn(),
    sys: {
      fileExists: vi.fn(),
      readFile: vi.fn(),
      readDirectory: vi.fn(),
      directoryExists: vi.fn(),
      getDirectories: vi.fn(),
      realpath: vi.fn()
    }
  };
});

type LanguageServiceModule = typeof import('./language-service');
type TsModule = typeof import('typescript');
type FsModule = typeof import('node:fs');

async function load(): Promise<{ mod: LanguageServiceModule, ts: TsModule, fs: FsModule }> {
  vi.resetModules();
  const ts = await import('typescript');
  const fs = await import('node:fs');
  const mod = await import('./language-service');
  return { mod, ts, fs };
}

/**
 * `createLanguageService` is mocked, so the real TS LanguageService never
 * exists to drive the private host through its normal internal calls.
 * Instead every fake LS created captures the host it was built with, so
 * tests can invoke the host's methods directly to exercise them.
 */
function mockLanguageServiceFactory(ts: TsModule): { hosts: LanguageServiceHost[], instances: { dispose: ReturnType<typeof vi.fn> }[] } {
  const hosts: LanguageServiceHost[] = [];
  const instances: { dispose: ReturnType<typeof vi.fn> }[] = [];
  vi.mocked(ts.createLanguageService).mockImplementation((host) => {
    hosts.push(host);
    const instance = { dispose: vi.fn() };
    instances.push(instance);
    return instance as unknown as LanguageService;
  });
  return { hosts, instances };
}

describe('getLanguageService()', () => {
  it('creates a LanguageService on first use', async () => {
    const { mod, ts } = await load();
    const { hosts, instances } = mockLanguageServiceFactory(ts);
    const registry = {};
    vi.mocked(ts.createDocumentRegistry).mockReturnValue(registry as never);

    const result = mod.getLanguageService({ strict: true });

    expect(result).toBe(instances[0]);
    expect(ts.createLanguageService).toHaveBeenCalledTimes(1);
    expect(ts.createLanguageService).toHaveBeenCalledWith(hosts[0], registry);
  });

  it('reuses the existing LanguageService when compilerOptions are unchanged', async () => {
    const { mod, ts } = await load();
    mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);
    const options: CompilerOptions = { strict: true };

    mod.getLanguageService(options);
    mod.getLanguageService({ strict: true });

    expect(ts.createLanguageService).toHaveBeenCalledTimes(1);
  });

  it('disposes and recreates the LanguageService when compilerOptions change', async () => {
    const { mod, ts } = await load();
    const { instances } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);

    const first = mod.getLanguageService({ strict: true });
    const second = mod.getLanguageService({ strict: false });

    expect(instances[0].dispose).toHaveBeenCalledTimes(1);
    expect(first).not.toBe(second);
    expect(ts.createLanguageService).toHaveBeenCalledTimes(2);
  });

  it('adds the project files to the root file names, without duplicating registered real files', async () => {
    const { mod, ts } = await load();
    const { hosts } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);

    mod.getLanguageService({}, ['/src/globals.d.ts', '/src/real.ts']);
    mod.registerRealFile('/src/real.ts');

    expect(hosts[0].getScriptFileNames()).toEqual(['/src/globals.d.ts', '/src/real.ts']);
  });

  it('updates the project files without recreating the LanguageService', async () => {
    const { mod, ts } = await load();
    const { hosts } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);

    mod.getLanguageService({}, ['/src/a.ts']);
    mod.getLanguageService({}, ['/src/b.ts']);

    expect(ts.createLanguageService).toHaveBeenCalledTimes(1);
    expect(hosts[0].getScriptFileNames()).toEqual(['/src/b.ts']);
  });
});

describe('disposeLanguageService()', () => {
  it('disposes the LanguageService and clears all internal state', async () => {
    const { mod, ts } = await load();
    const { hosts, instances } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);

    mod.getLanguageService({ strict: true }, ['/src/globals.d.ts']);
    mod.registerRealFile('/src/real.ts');
    mod.upsertVirtualFile('/src/virtual.ts', 'content');

    mod.disposeLanguageService();

    expect(instances[0].dispose).toHaveBeenCalledTimes(1);
    expect(hosts[0].getScriptFileNames()).toEqual([]);
  });

  it('falls back to empty compilationSettings once disposed, via the stale host closure', async () => {
    const { mod, ts } = await load();
    const { hosts } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);

    mod.getLanguageService({ strict: true });
    mod.disposeLanguageService();

    expect(hosts[0].getCompilationSettings()).toEqual({});
  });
});

describe('registerRealFile() / removeRealFile()', () => {
  it('adds and removes a real file from the tracked root file names', async () => {
    const { mod, ts } = await load();
    const { hosts } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);
    mod.getLanguageService({});

    mod.registerRealFile('/src/real.ts');
    expect(hosts[0].getScriptFileNames()).toEqual(['/src/real.ts']);

    mod.removeRealFile('/src/real.ts');
    expect(hosts[0].getScriptFileNames()).toEqual([]);
  });
});

describe('upsertVirtualFile() / removeVirtualFile()', () => {
  it('adds a virtual file at version 1', async () => {
    const { mod, ts } = await load();
    const { hosts } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);
    mod.getLanguageService({});

    mod.upsertVirtualFile('/virtual.ts', 'content');

    expect(hosts[0].getScriptFileNames()).toEqual(['/virtual.ts']);
    expect(hosts[0].getScriptVersion('/virtual.ts')).toBe('1');
  });

  it('bumps the version when the content actually changes', async () => {
    const { mod, ts } = await load();
    const { hosts } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);
    mod.getLanguageService({});

    mod.upsertVirtualFile('/virtual.ts', 'content');
    mod.upsertVirtualFile('/virtual.ts', 'other content');

    expect(hosts[0].getScriptVersion('/virtual.ts')).toBe('2');
  });

  it('does not bump the version for a no-op write', async () => {
    const { mod, ts } = await load();
    const { hosts } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);
    mod.getLanguageService({});

    mod.upsertVirtualFile('/virtual.ts', 'content');
    mod.upsertVirtualFile('/virtual.ts', 'content');

    expect(hosts[0].getScriptVersion('/virtual.ts')).toBe('1');
  });

  it('removes a virtual file', async () => {
    const { mod, ts } = await load();
    const { hosts } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);
    mod.getLanguageService({});
    mod.upsertVirtualFile('/virtual.ts', 'content');

    mod.removeVirtualFile('/virtual.ts');

    expect(hosts[0].getScriptFileNames()).toEqual([]);
  });
});

describe('LanguageServiceHost', () => {
  async function setupHost() {
    const { mod, ts, fs } = await load();
    const { hosts } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);
    mod.getLanguageService({ strict: true });
    return { mod, ts, fs, host: hosts[0] };
  }

  describe('getScriptVersion()', () => {
    it('returns the virtual file version for a virtual file', async () => {
      const { mod, host } = await setupHost();
      mod.upsertVirtualFile('/virtual.ts', 'content');

      expect(host.getScriptVersion('/virtual.ts')).toBe('1');
    });

    it('returns the mtime-based version for a real file', async () => {
      const { fs, host } = await setupHost();
      vi.mocked(fs.statSync).mockReturnValue({ mtimeMs: 1234 } as never);

      expect(host.getScriptVersion('/real.ts')).toBe('1234');
    });

    it('falls back to the last known version when the file can no longer be stat\'d', async () => {
      const { fs, host } = await setupHost();
      vi.mocked(fs.statSync).mockReturnValueOnce({ mtimeMs: 1234 } as never);
      host.getScriptVersion('/real.ts');

      vi.mocked(fs.statSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      expect(host.getScriptVersion('/real.ts')).toBe('1234');
    });

    it('falls back to \'0\' when the file was never successfully stat\'d', async () => {
      const { fs, host } = await setupHost();
      vi.mocked(fs.statSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });

      expect(host.getScriptVersion('/never-existed.ts')).toBe('0');
    });
  });

  describe('getScriptSnapshot()', () => {
    it('returns a snapshot of the virtual file content', async () => {
      const { mod, host } = await setupHost();
      mod.upsertVirtualFile('/virtual.ts', 'const x = 1;');

      const snapshot = host.getScriptSnapshot('/virtual.ts');

      expect(snapshot?.getText(0, snapshot.getLength())).toBe('const x = 1;');
    });

    it('returns undefined when the real file does not exist', async () => {
      const { ts, host } = await setupHost();
      vi.mocked(ts.sys.fileExists).mockReturnValue(false);

      expect(host.getScriptSnapshot('/missing.ts')).toBeUndefined();
    });

    it('returns undefined when the real file exists but cannot be read', async () => {
      const { ts, host } = await setupHost();
      vi.mocked(ts.sys.fileExists).mockReturnValue(true);
      vi.mocked(ts.sys.readFile).mockReturnValue(undefined);

      expect(host.getScriptSnapshot('/unreadable.ts')).toBeUndefined();
    });

    it('returns a snapshot of the real file content', async () => {
      const { ts, host } = await setupHost();
      vi.mocked(ts.sys.fileExists).mockReturnValue(true);
      vi.mocked(ts.sys.readFile).mockReturnValue('export {};');

      const snapshot = host.getScriptSnapshot('/real.ts');

      expect(snapshot?.getText(0, snapshot.getLength())).toBe('export {};');
    });
  });

  it('getCurrentDirectory() returns process.cwd()', async () => {
    const { host } = await setupHost();

    expect(host.getCurrentDirectory()).toBe(process.cwd());
  });

  it('getCompilationSettings() returns the current compilerOptions', async () => {
    const { host } = await setupHost();

    expect(host.getCompilationSettings()).toEqual({ strict: true });
  });

  it('getDefaultLibFileName() delegates to ts.getDefaultLibFilePath()', async () => {
    const { ts, host } = await setupHost();
    vi.mocked(ts.getDefaultLibFilePath).mockReturnValue('/lib/lib.d.ts');
    const opts: CompilerOptions = { target: 99 };

    expect(host.getDefaultLibFileName(opts)).toBe('/lib/lib.d.ts');
    expect(ts.getDefaultLibFilePath).toHaveBeenCalledWith(opts);
  });

  describe('fileExists()', () => {
    it('returns true for a virtual file', async () => {
      const { mod, host } = await setupHost();
      mod.upsertVirtualFile('/virtual.ts', 'content');

      expect(host.fileExists('/virtual.ts')).toBe(true);
    });

    it('delegates to sys.fileExists for a non-virtual file', async () => {
      const { ts, host } = await setupHost();
      vi.mocked(ts.sys.fileExists).mockReturnValue(true);

      expect(host.fileExists('/real.ts')).toBe(true);
      expect(ts.sys.fileExists).toHaveBeenCalledWith('/real.ts');
    });
  });

  describe('readFile()', () => {
    it('returns the virtual file content', async () => {
      const { mod, host } = await setupHost();
      mod.upsertVirtualFile('/virtual.ts', 'content');

      expect(host.readFile('/virtual.ts')).toBe('content');
    });

    it('delegates to sys.readFile for a non-virtual file', async () => {
      const { ts, host } = await setupHost();
      vi.mocked(ts.sys.fileExists).mockReturnValue(true);
      vi.mocked(ts.sys.readFile).mockReturnValue('real content');

      expect(host.readFile('/real.ts')).toBe('real content');
      expect(ts.sys.readFile).toHaveBeenCalledWith('/real.ts');
    });
  });

  it('readDirectory / directoryExists / getDirectories / realpath delegate directly to ts.sys', async () => {
    const { ts, host } = await setupHost();

    expect(host.readDirectory).toBe(ts.sys.readDirectory);
    expect(host.directoryExists).toBe(ts.sys.directoryExists);
    expect(host.getDirectories).toBe(ts.sys.getDirectories);
    expect(host.realpath).toBe(ts.sys.realpath);
  });
});

describe('document overlays', () => {
  async function setupHost() {
    const { mod, ts } = await load();
    const { hosts } = mockLanguageServiceFactory(ts);
    vi.mocked(ts.createDocumentRegistry).mockReturnValue({} as never);
    mod.getLanguageService({});
    return { mod, ts, host: hosts[0] };
  }

  it('reads the unsaved text of an open document in place of the file on disk, whatever the separators and the drive case', async () => {
    const { mod, ts, host } = await setupHost();
    vi.mocked(ts.sys.fileExists).mockReturnValue(false);

    mod.setDocumentOverlay('C:\\src\\open.ts', 'unsaved');

    expect(host.readFile('c:/src/open.ts')).toBe('unsaved');
    expect(host.fileExists('C:/src/open.ts')).toBe(true);
    expect(host.getScriptVersion('c:/src/open.ts')).toBe('overlay-1');
    const snapshot = host.getScriptSnapshot('c:/src/open.ts');
    expect(snapshot?.getText(0, snapshot.getLength())).toBe('unsaved');
    expect(mod.readDocument('c:/src/open.ts')).toBe('unsaved');

    mod.setDocumentOverlay('c:/src/open.ts', 'changed');
    expect(host.getScriptVersion('c:/src/open.ts')).toBe('overlay-2');
  });

  it('reads the file on disk again once the document is closed', async () => {
    const { mod, ts, host } = await setupHost();
    vi.mocked(ts.sys.fileExists).mockReturnValue(true);
    vi.mocked(ts.sys.readFile).mockReturnValue('saved');

    mod.setDocumentOverlay('/src/closed.ts', 'unsaved');
    mod.removeDocumentOverlay('/src/closed.ts');

    expect(host.readFile('/src/closed.ts')).toBe('saved');
    expect(mod.readDocument('/src/closed.ts')).toBe('saved');
  });

  it('reads nothing for a file that is neither open nor on disk', async () => {
    const { mod, ts } = await load();
    vi.mocked(ts.sys.fileExists).mockReturnValue(false);

    expect(mod.readDocument('/src/missing.ts')).toBeUndefined();
  });
});

describe('getProjectLanguageService()', () => {
  it('returns the default instance, used by the module-level functions, for a file outside of any project', async () => {
    const { mod, ts } = await load();
    const { instances } = mockLanguageServiceFactory(ts);

    expect(mod.getProjectLanguageService(undefined).getLanguageService({})).toBe(mod.getLanguageService({}));
    expect(instances).toHaveLength(1);
  });

  it('returns one instance per tsconfig.json, each with its own LanguageService', async () => {
    const { mod, ts } = await load();
    const { hosts, instances } = mockLanguageServiceFactory(ts);

    const root = mod.getProjectLanguageService('C:\\repo\\tsconfig.json');
    const docs = mod.getProjectLanguageService('c:/repo/docs/tsconfig.json');
    expect(mod.getProjectLanguageService('c:/repo/tsconfig.json')).toBe(root);
    expect(docs).not.toBe(root);

    root.getLanguageService({ strict: true });
    docs.getLanguageService({ strict: false });
    root.upsertVirtualFile('/repo/a.ts.__typecheck__.ts', 'a');
    docs.registerRealFile('/repo/docs/b.ts');

    expect(hosts[0].getScriptFileNames()).toEqual(['/repo/a.ts.__typecheck__.ts']);
    expect(hosts[1].getScriptFileNames()).toEqual(['/repo/docs/b.ts']);

    mod.disposeProjectLanguageServices();
    expect(instances.every(instance => instance.dispose.mock.calls.length === 1)).toBe(true);
    expect(mod.getProjectLanguageService('c:/repo/tsconfig.json')).not.toBe(root);
  });

  it('disposes an instance that never created its LanguageService', async () => {
    const { mod } = await load();

    expect(() => mod.getProjectLanguageService('/other/tsconfig.json').dispose()).not.toThrow();
  });
});
