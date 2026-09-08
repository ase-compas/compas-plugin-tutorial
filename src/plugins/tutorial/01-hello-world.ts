/* =========================================================================
 * Step 1 — A plugin is a custom element
 * =========================================================================
 *
 * Welcome. Work through these files in order; each one is a real, running
 * plugin. Pick it from the dropdown at the top of the dev shell, read the
 * comments, then change something and watch it reload.
 *
 * There is only one rule in this step:
 *
 *   A plugin is a class extending HTMLElement, exported as `default`.
 *
 * OpenSCD imports your module, registers `default` in the browser's custom
 * element registry under a tag name it picks, and renders that tag into the
 * app. You never call `customElements.define` yourself, and you never choose
 * the tag name,  which is why the export has to be `default`: it is the only
 * thing OpenSCD knows how to look for.
 *
 * In this repository the file's path is its URL. Save a file anywhere under
 * `src/plugins/` and it is served at the matching `/plugins/….js`. This one
 * is at `/plugins/tutorial/01-hello-world.js` — and it appears in the shell's
 * dropdown. No registration list to edit.
 */

export default class Step1HelloWorld extends HTMLElement {
  /*
   * `connectedCallback` is the standard custom element hook: the browser calls
   * it when the element is put into the page. Render here, not in the
   * constructorl, a constructor is not allowed to touch its own children.
   */
  connectedCallback() {
    this.innerHTML = `
      <h2>Hello from your first plugin</h2>
      <p>
        This plugin knows nothing about the document yet — it does not even
        have one. Open <code>scl/example.scd</code> with the button above and
        nothing here will change.
      </p>
      <p>Step 2 fixes that.</p>`;
  }
}

/*
 * Try it:
 *
 *   1. Change the heading above and save. The dev shell swaps this plugin in
 *      place. No page reload, and any open document stays open.
 *   2. Copy this file to `src/plugins/tutorial/my-plugin.ts`. It shows up in
 *      the dropdown by itself.
 *
 * Next: 02-properties.ts — how OpenSCD hands you the document.
 */
