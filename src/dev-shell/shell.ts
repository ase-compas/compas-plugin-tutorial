import { XMLEditor } from '@openscd/oscd-editor';
import { convertEdit } from '@openscd/oscd-api/utils.js';
import type { Edit, EditDetailV2, OpenDetail } from '@openscd/oscd-api';

import './shell.css';

/** Every module under `src/plugins/`, by the URL this repo serves it at. */
const pluginUrls = Object.keys(import.meta.glob(['/src/plugins/**/*.{js,ts}', '!**/*.{test,spec}.*']))
  .map(src => src.replace('/src/plugins/', '/plugins/').replace(/\.[jt]s$/, '.js'))
  .sort();

const icon = (path: string) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;

const ICONS = {
  save: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  undo: 'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z',
  redo: 'M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z',
};

/**
 * A minimal stand-in for OpenSCD core: it loads one plugin, hands it the
 * properties from the plugin API, and turns the events the plugin dispatches
 * into edits on an `XMLEditor`.
 */
export class DevShell extends HTMLElement {
  /** The plugin API properties, mirrored onto the plugin element. */
  editor = new XMLEditor();
  docs: Record<string, XMLDocument> = {};
  doc?: XMLDocument;
  docName?: string;
  locale = navigator.language;

  docVersion = -1;
  get editCount() {
    return this.docVersion;
  }

  #url = new URLSearchParams(location.search).get('plugin') ?? pluginUrls[0];
  #plugin?: HTMLElement;
  #host!: HTMLElement;
  #tags = new Map<CustomElementConstructor, string>();
  #assigned = new Map<string, unknown>();

  get pluginUrl() {
    return this.#url;
  }

  connectedCallback() {
    this.innerHTML = `
      <header class="bar">
        <h1>OpenSCD plugin dev shell</h1>
        <select title="Plugin to develop">
          ${pluginUrls.map(url => `<option>${url}</option>`).join('')}
        </select>
        <span class="spacer"></span>
        <span class="doc-name"></span>
        <button class="open filled">Open document</button>
        <button class="save" title="Save SCL document">${icon(ICONS.save)}</button>
        <button class="undo" title="Undo">${icon(ICONS.undo)}</button>
        <button class="redo" title="Redo">${icon(ICONS.redo)}</button>
        <input type="file" hidden accept=".scd,.ssd,.isd,.iid,.cid,.icd,.sed,.xml" />
      </header>
      <div class="plugin"></div>`;

    const $ = <E extends Element>(sel: string) => this.querySelector<E>(sel)!;
    this.#host = $('.plugin');

    const select = $<HTMLSelectElement>('select');
    if (this.#url && !pluginUrls.includes(this.#url))
      select.add(new Option(this.#url), 0); // a plugin served from elsewhere
    select.value = this.#url;
    select.onchange = () => {
      this.#url = select.value;
      history.replaceState(null, '', `?plugin=${encodeURIComponent(this.#url)}`);
      this.#renderPlugin();
    };

    const file = $<HTMLInputElement>('input[type=file]');
    $<HTMLButtonElement>('.open').onclick = () => file.click();
    file.onchange = async () => {
      const [selected] = file.files ?? [];
      if (selected) this.open(await selected.text(), selected.name);
      file.value = '';
    };
    $<HTMLButtonElement>('.save').onclick = () => this.#save();
    $<HTMLButtonElement>('.undo').onclick = () => this.editor.undo();
    $<HTMLButtonElement>('.redo').onclick = () => this.editor.redo();

    // A plugin asks for changes by dispatching events; the shell applies them.
    this.addEventListener('oscd-edit-v2', ({ detail }: CustomEvent<EditDetailV2>) =>
      this.editor.commit(detail.edit, detail),
    );
    this.addEventListener('oscd-edit', ({ detail }: CustomEvent<Edit>) =>
      this.editor.commit(convertEdit(detail)),
    );
    this.addEventListener('oscd-open', ({ detail }: CustomEvent<OpenDetail>) =>
      this.#setDoc(detail.doc, detail.docName),
    );

    this.editor.subscribe(() => {
      this.docVersion += 1;
      this.#update();
    });

    // Keep the open document across full page reloads.
    addEventListener('beforeunload', () => this.#stash());
    this.#unstash();

    this.#renderPlugin();
    this.#update();
  }

  /** Parses `text` as SCL and makes it the document under edit. */
  open(text: string, docName: string) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    this.#setDoc(doc, docName);
  }

  /** Re-imports the plugin module, keeping document and edits in place. */
  reloadPlugin() {
    this.#renderPlugin(`?t=${Date.now()}`);
  }

  #setDoc(doc: XMLDocument, docName: string) {
    this.docs = { ...this.docs, [docName]: doc };
    this.doc = doc;
    this.docName = docName;
    this.#update();
  }

  async #renderPlugin(bust = '') {
    if (!this.#url) {
      this.#host.innerHTML = '<p class="hint">Add a module to <code>src/plugins/</code> to get started.</p>';
      return;
    }

    const module = await import(/* @vite-ignore */ this.#url + bust);
    const plugin: CustomElementConstructor = module.default;

    // A class may only be registered once, so every reload gets its own tag.
    if (!this.#tags.has(plugin)) {
      const tag = `oscd-plugin-${this.#tags.size}`;
      customElements.define(tag, plugin);
      this.#tags.set(plugin, tag);
    }

    this.#plugin = document.createElement(this.#tags.get(plugin)!);
    this.#assigned.clear();
    this.#host.replaceChildren(this.#plugin);
    this.#update();
  }

  /** Hands the plugin API properties to the plugin, and refreshes the bar. */
  #update() {
    const { editor, docs, doc, docName, docVersion, editCount, locale } = this;
    // `editCount` is CoMPAS OpenSCD's name for `docVersion`; set both so that
    // a plugin written against either name works.
    this.#assign({ editor, docs, doc, docName, docVersion, editCount, locale });

    this.querySelector('.doc-name')!.textContent = docName ?? '';
    this.querySelector<HTMLButtonElement>('.save')!.disabled = !doc;
    this.querySelector<HTMLButtonElement>('.undo')!.disabled = !editor.past.length;
    this.querySelector<HTMLButtonElement>('.redo')!.disabled = !editor.future.length;
  }

  /**
   * Sets only the properties that actually changed. 
   */
  #assign(props: Record<string, unknown>) {
    if (!this.#plugin) return;
    for (const [key, value] of Object.entries(props))
      if (!Object.is(this.#assigned.get(key), value)) {
        this.#assigned.set(key, value);
        Object.assign(this.#plugin, { [key]: value });
      }
  }

  #save() {
    if (!this.doc) return;
    const blob = new Blob([new XMLSerializer().serializeToString(this.doc)], {
      type: 'application/xml',
    });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: this.docName ?? 'document.scd',
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  #stash() {
    if (!this.doc || !this.docName) return;
    try {
      sessionStorage.setItem('oscd-doc-name', this.docName);
      sessionStorage.setItem(
        'oscd-doc',
        new XMLSerializer().serializeToString(this.doc),
      );
    } catch {

    }
  }

  #unstash() {
    const text = sessionStorage.getItem('oscd-doc');
    const docName = sessionStorage.getItem('oscd-doc-name');
    if (text && docName) this.open(text, docName);
  }
}

customElements.define('oscd-dev-shell', DevShell);

// The dev server tells us which plugin changed instead of reloading the page,
// so that the document under edit survives editing a plugin.
import.meta.hot?.on('oscd:plugin-update', ({ url }: { url: string }) => {
  const shell = document.querySelector<DevShell>('oscd-dev-shell');
  if (shell?.pluginUrl === url) shell.reloadPlugin();
  else location.reload();
});
