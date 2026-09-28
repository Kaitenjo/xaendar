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
