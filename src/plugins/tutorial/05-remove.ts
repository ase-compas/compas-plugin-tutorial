import type { Remove } from '@openscd/oscd-api';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

/* =========================================================================
 * Step 5 — Taking elements out: Remove
 * =========================================================================
 *
 * Remove is the simplest edit of the four. It names a node and nothing else:
 *
 *   { node }
 *
 * No parent, no index. OpenSCD reads those off the node itself. Removing an
 * element takes its children with it, exactly like `node.remove()`.
 *
 * So why not just call `node.remove()`? Because of what OpenSCD records while
 * it applies the edit: the parent and the next sibling. That is what lets undo
 * put the element back **where it was** rather than at the end. Call `.remove()`
 * yourself and that information is gone the moment the node is detached — the
 * change cannot be undone, and no other plugin learns about it.
 */

export default class Step5Remove extends HTMLElement {
  #doc?: XMLDocument;

  set doc(doc: XMLDocument) {
    this.#doc = doc;
    this.render();
  }

  set editCount(_count: number) {
    this.render();
  }

  removeBay(bay: Element) {
    const edit: Remove = { node: bay };

    this.dispatchEvent(
      newEditEventV2(edit, { title: `Delete ${bay.getAttribute('name')}` }),
    );
  }

  render() {
    const bays = [...(this.#doc?.querySelectorAll('Bay') ?? [])];

    if (!bays.length) {
      this.innerHTML = '<p>Open a document with a Bay — or add one in step 4.</p>';
      return;
    }

    this.innerHTML = `<ol>${bays
      .map(bay => `<li>${bay.getAttribute('name')} <button>delete</button></li>`)
      .join('')}</ol>`;

    this.querySelectorAll<HTMLButtonElement>('button').forEach((button, i) => {
      button.onclick = () => this.removeBay(bays[i]);
    });
  }
}

/*
 * Try it:
 *
 *   1. Go to step 4 and add two bays, so the list reads Bay 3, Bay 2, Bay A.
 *   2. Come back and delete the MIDDLE one, then undo. It reappears in the
 *      middle, not at the end.
 *   3. Notice each delete is its own history entry. Deleting five bays costs
 *      the user five undos — step 6 fixes that.
 *
 * Next: 06-complex-edits.ts — several changes as one.
 */
