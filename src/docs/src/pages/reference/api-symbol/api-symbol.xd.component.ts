import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';
import { translations } from '../../../core/i18n/i18n';
import { href, lang, path } from '../../../core/router/router';
import { API_REFERENCE_PATH } from '../../../core/routes/routes';
import type { PagePath } from '../../../core/routes/routes';
import { findApiSymbol, packageFile } from '../api/api.data';
import type { ApiKind, ApiMember, ApiMemberGroup, ApiPackageTexts, ApiSymbolEntry, ApiSymbolTexts, ApiUsage } from '../api/api.data';

/**
 * The texts of every package in every language, loaded on demand: a page loads the ones of the package of its symbol,
 * in the current language.
 */
const API_TEXTS = import.meta.glob<ApiPackageTexts>('../../../i18n/api/*/*.json', { import: 'default' });

/**
 * A group of members of the symbol, under its heading.
 */
type GroupView = {
  /**
   * The group.
   */
  readonly key: ApiMemberGroup;
  /**
   * The heading of the group, in the current language.
   */
  readonly title: string;
  /**
   * The members of the group, with their descriptions in the current language.
   */
  readonly members: ReadonlyArray<ApiMember & { readonly text: string }>;
};

/**
 * What the page displays: the symbol of the path, with its texts in the current language.
 */
type SymbolView = {
  /**
   * Whether a symbol has the path. When no symbol has it, the other members are empty.
   */
  readonly found: boolean;
  /**
   * The name of the package exporting the symbol.
   */
  readonly packageName: string;
  /**
   * The name of the symbol.
   */
  readonly name: string;
  /**
   * The kind of the symbol.
   */
  readonly kind: ApiKind;
  /**
   * The declaration of the symbol.
   */
  readonly signature: string;
  /**
   * The statement importing the symbol, empty for the globals.
   */
  readonly importStatement: string;
  /**
   * The summary of the symbol.
   */
  readonly summary: string;
  /**
   * The description of the symbol.
   */
  readonly description: string;
  /**
   * The members of the symbol, by group, in the order of the groups.
   */
  readonly groups: readonly GroupView[];
  /**
   * The usage notes, with their titles and texts.
   */
  readonly usage: ReadonlyArray<ApiUsage & { readonly title: string; readonly body: string }>;
  /**
   * The guides explaining the symbol, with their titles and links.
   */
  readonly guides: ReadonlyArray<{ readonly title: string; readonly href: string }>;
};

/**
 * The page of a symbol of the API reference, below `reference/api`: the path names the package and the symbol, as in
 * `reference/api/core/signals/signal`. Its texts are loaded with the page, separately from the messages of the site.
 */
@WebComponent({
  selector: 'page-reference-api-symbol',
  styleUrl: '../../page.css',
  templateUrl: './api-symbol.xd.component.html'
})
export class ReferenceApiSymbolPage extends CustomElement {
  /**
   * The link back to the API reference.
   */
  public readonly referenceHref = computed(() => this._computeReferenceHref());
  /**
   * What the page displays.
   */
  public readonly view = computed(() => this._computeView());
  /**
   * The texts loaded last, with the key of the file they were loaded from.
   */
  private readonly _loaded = signal<{ key: string; texts: ApiPackageTexts } | undefined>(undefined);
  /**
   * The symbol of the path, with its package.
   */
  private readonly _entry = computed(() => this._computeEntry());
  /**
   * The key of the file of the texts the page needs: the ones of the package of the symbol, in the current language.
   */
  private readonly _textsKey = computed(() => this._computeTextsKey());
  /**
   * The groups of members, in the order they are listed in.
   */
  private readonly _groups: readonly ApiMemberGroup[] = ['variants', 'parameters', 'options', 'properties', 'methods'];

  /**
   * Loads the texts the page needs whenever they change: when another package or another language is displayed.
   */
  public onInit(): void {
    this.effect(() => {
      const key = this._textsKey();
      if (key) {
        untracked(() => this._load(key));
      }
    });
  }

  /**
   * Loads a file of texts and, unless another one was asked for in the meantime, stores it.
   *
   * @param key - The key of the file.
   */
  private async _load(key: string): Promise<void> {
    const texts = await API_TEXTS[key]();
    if (this._textsKey() === key) {
      this._loaded.set({ key, texts });
    }
  }

  /**
   * Computes the value of `_entry`.
   *
   * @returns The symbol of the path with its package, `undefined` if no symbol has the path.
   */
  private _computeEntry(): ApiSymbolEntry | undefined {
    return findApiSymbol(path());
  }

  /**
   * Computes the value of `referenceHref`.
   *
   * @returns The link back to the API reference.
   */
  private _computeReferenceHref(): string {
    return href(API_REFERENCE_PATH);
  }

  /**
   * Computes the value of `_textsKey`.
   *
   * @returns The key of the file of the texts, `undefined` when no symbol has the path.
   */
  private _computeTextsKey(): string | undefined {
    const entry = this._entry();
    return entry && `../../../i18n/api/${lang()}/${packageFile(entry.apiPackage.name)}.json`;
  }

  /**
   * Computes the value of `view`.
   *
   * @returns What the page displays. The texts are empty until they are loaded.
   */
  private _computeView(): SymbolView {
    const entry = this._entry();
    if (!entry) {
      return {
        found: false,
        packageName: '',
        name: '',
        kind: 'type',
        signature: '',
        importStatement: '',
        summary: '',
        description: '',
        groups: [],
        usage: [],
        guides: []
      };
    }

    const loaded = this._loaded();
    const texts = loaded && loaded.key === this._textsKey() ? loaded.texts[entry.symbol.name] : undefined;
    const { symbol } = entry;
    return {
      found: true,
      packageName: entry.apiPackage.name,
      name: symbol.name,
      kind: symbol.kind,
      signature: symbol.signature,
      importStatement: this._importStatement(entry),
      summary: texts?.summary ?? '',
      description: texts?.description ?? '',
      groups: this._groupsOf(symbol.members, texts),
      usage: this._usageOf(symbol.usage, texts),
      guides: this._guidesOf(symbol.guides)
    };
  }

  /**
   * Writes the statement importing a symbol.
   *
   * @param entry - The symbol, with its package.
   * @returns The statement, `import type` for the types, empty for the globals, which are installed rather than imported.
   */
  private _importStatement({ apiPackage, symbol }: ApiSymbolEntry): string {
    switch (symbol.kind) {
      case 'global':
        return '';
      case 'type':
        return `import type { ${symbol.name} } from '${apiPackage.name}';`;
      default:
        return `import { ${symbol.name} } from '${apiPackage.name}';`;
    }
  }

  /**
   * Splits the members of a symbol by group.
   *
   * @param members - The members of the symbol.
   * @param texts - The texts of the symbol, `undefined` until they are loaded.
   * @returns The groups with at least a member, in the order they are listed in.
   */
  private _groupsOf(members: readonly ApiMember[] | undefined, texts: ApiSymbolTexts | undefined): GroupView[] {
    if (!members?.length) {
      return [];
    }

    const groups: GroupView[] = [];
    const titles = translations().reference.symbol.groups;
    for (let i = 0; i < this._groups.length; i++) {
      const key = this._groups[i];
      const grouped = members.filter(member => member.group === key);
      if (grouped.length) {
        groups.push({ key, title: titles[key], members: grouped.map(member => ({ ...member, text: texts?.members?.[member.name] ?? '' })) });
      }
    }
    return groups;
  }

  /**
   * Adds their texts to the usage notes of a symbol.
   *
   * @param usage - The usage notes of the symbol.
   * @param texts - The texts of the symbol, `undefined` until they are loaded.
   * @returns The usage notes with their titles and texts, in order.
   */
  private _usageOf(usage: readonly ApiUsage[] | undefined, texts: ApiSymbolTexts | undefined): SymbolView['usage'] {
    if (!usage?.length) {
      return [];
    }

    return usage.map(note => {
      const noteTexts = texts?.usage?.[note.key];
      return { ...note, title: noteTexts?.title ?? '', body: noteTexts?.body ?? '' };
    });
  }

  /**
   * Links the guides explaining a symbol.
   *
   * @param guides - The paths of the guides.
   * @returns The titles and the links of the guides, in order.
   */
  private _guidesOf(guides: readonly PagePath[] | undefined): SymbolView['guides'] {
    if (!guides?.length) {
      return [];
    }

    const titles = translations().nav.pages;
    return guides.map(guide => ({ title: titles[guide], href: href(guide) }));
  }
}
