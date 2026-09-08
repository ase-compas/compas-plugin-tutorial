/* =========================================================================
 * Step 2 — The properties OpenSCD sets on your element
 * =========================================================================
 *
 * OpenSCD talks to your plugin by assigning JavaScript **properties** on the
 * element. An attribute can only ever be a string; these
 * values are live objects, so `element.doc = someXMLDocument` is the only way
 * to pass them.
 *
 * The ones you will actually use:
 *
 *   doc        the XMLDocument being edited          — the important one
 *   editCount  changes every time the document does  — the other important one
 *   docName    its file name, e.g. "example.scd"
 *   docs       every open document, by name
 *   locale     the user's language tag, e.g. "de-AT"
 *
 * Because they are plain properties, a **setter** is your change notification.
 * That is the whole rendering model: OpenSCD assigns, your setter runs, you
 * re-render.
 */

export default class Step2Properties extends HTMLElement {
  #doc?: XMLDocument;
  #docName?: string;
  #locale = 'en';

  /*
   * `doc` arrives when the user opens a document, and again whenever they
   * switch to a different one. Store it and render.
   */
  set doc(doc: XMLDocument) {
    this.#doc = doc;
    this.render();
  }

  set docName(docName: string) {
    this.#docName = docName;
    this.render();
  }

  set locale(locale: string) {
    this.#locale = locale;
    this.render();
  }

  /* -----------------------------------------------------------------------
   * editCount — the one people get wrong
   * -----------------------------------------------------------------------
   *
   * When an edit is applied, the `doc` property does NOT change: it is the
   * same XMLDocument object, mutated in place. So a `doc` setter alone will
   * never tell you an edit happened, and your plugin will silently show stale
   * data after the very first edit.
   *
   * `editCount` is how OpenSCD tells you. It starts at -1, and goes up by one
   * on every edit, including every undo and every redo. The value itself is
   * meaningless; only the fact that it changed matters.
   *
   *   Re-render on editCount, or your plugin will go stale.
   *
   * A note on names. Newer OpenSCD API documentation calls this same signal
   * `docVersion`. CoMPAS OpenSCD,  the host these plugins are written for,
   * sets `editCount`. Implement `editCount` first; add `docVersion` as a
   * second setter if you also want to run on hosts that use the new name.
   * The dev shell sets both, so either works here.
   */
  set editCount(_count: number) {
    this.render();
  }

  set docVersion(_version: unknown) {
    this.render();
  }

  render() {
    if (!this.#doc) {
      this.innerHTML = '<p>Open a document to see its properties.</p>';
      return;
    }

    const count = (tag: string) => this.#doc!.querySelectorAll(tag).length;

    this.innerHTML = `
      <h2>${this.#docName}</h2>
      <dl>
        <dt>Root element</dt><dd>${this.#doc.documentElement.tagName}</dd>
        <dt>Substations</dt><dd>${count('Substation')}</dd>
        <dt>IEDs</dt><dd>${count('IED')}</dd>
        <dt>Your locale</dt><dd>${this.#locale}</dd>
      </dl>`;
  }
}

/*
 * Try it:
 *
 *   1. Open scl/example.scd. The counts appear.
 *   2. Switch to the "list-ieds" example, rename an IED, then come back here.
 *      The numbers are right, because this plugin re-rendered on editCount.
 *   3. Comment out the `editCount` setter and repeat. Now it goes stale.
 *
 * Next: 03-set-attributes.ts — changing the document.
 */
