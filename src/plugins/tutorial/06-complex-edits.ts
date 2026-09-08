import type { EditV2, Insert, Remove, SetAttributes } from '@openscd/oscd-api';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

/* =========================================================================
 * Step 6 — Several changes as one: complex edits
 * =========================================================================
 *
 * The `EditV2` type is defined like this:
 *
 *   type EditV2 = Insert | SetAttributes | SetTextContent | Remove | EditV2[]
 *
 * That last member is the whole lesson. An **array of edits is itself an
 * edit**, and OpenSCD treats it as one indivisible step:
 *
 *   - the edits are applied in order, each one seeing the result of the last
 *   - they produce ONE entry in the history, under one title
 *   - ONE undo reverses all of them
 *
 * That is what complex edits are for. Any change a user thinks of as a single
 * action should be a single edit, however many nodes it touches. "Delete this
 * bay" that also cleans up three references is one edit, not four — otherwise
 * the user has to press undo four times and passes through three states of the
 * document that never should have existed.
 *
 * The fourth edit type, `SetTextContent`, fills in here for completeness:
 * `{ element, textContent }` replaces an element's text. SCL uses it for
 * elements like `<P type="IP">` that carry a value rather than attributes.
 */

const SCL_NS = 'http://www.iec.ch/61850/2003/SCL';

export default class Step6ComplexEdits extends HTMLElement {
  #doc?: XMLDocument;

  set doc(doc: XMLDocument) {
    this.#doc = doc;
    this.render();
  }

  set editCount(_count: number) {
    this.render();
  }

  /**
   * Replaces every bay in a voltage level with a single fresh one — a delete
   * and an insert that only make sense together.
   */
  resetBays(voltageLevel: Element) {
    const bay = this.#doc!.createElementNS(SCL_NS, 'Bay');
    bay.setAttribute('name', 'Bay 1');

    /*
     * Mixed types are fine: an array may hold Removes, Inserts and
     * SetAttributes side by side.
     */
    const edit: EditV2 = [
      ...[...voltageLevel.querySelectorAll('Bay')].map(
        (node): Remove => ({ node }),
      ),
      { parent: voltageLevel, node: bay, reference: null } as Insert,
      {
        element: voltageLevel,
        attributes: { desc: 'Reset by the tutorial' },
        attributesNS: {},
      } as SetAttributes,
    ];

    /*
     * One event, one title, one undo — no matter how many bays were removed.
     *
     * There is also a `squash: true` option, which merges this edit into the
     * PREVIOUS history entry instead of adding a new one. It is for follow-up
     * changes, like a slider that fires while being dragged: squash every
     * update after the first so the user gets one undo, not two hundred.
     */
    this.dispatchEvent(
      newEditEventV2(edit, { title: `Reset bays in ${voltageLevel.getAttribute('name')}` }),
    );
  }

  render() {
    const voltageLevels = [...(this.#doc?.querySelectorAll('VoltageLevel') ?? [])];

    if (!voltageLevels.length) {
      this.innerHTML = '<p>Open a document with a VoltageLevel.</p>';
      return;
    }

    this.innerHTML = voltageLevels
      .map(
        voltageLevel => `
        <h3>${voltageLevel.getAttribute('name')}
          <small>${voltageLevel.getAttribute('desc') ?? ''}</small></h3>
        <ol>${[...voltageLevel.querySelectorAll('Bay')]
          .map(bay => `<li>${bay.getAttribute('name')}</li>`)
          .join('')}</ol>
        <button>Reset bays</button>`,
      )
      .join('');

    this.querySelectorAll<HTMLButtonElement>('button').forEach((button, i) => {
      button.onclick = () => this.resetBays(voltageLevels[i]);
    });
  }
}

/*
 * Try it:
 *
 *   1. Add several bays in step 4, then come back and press "Reset bays".
 *   2. Press undo ONCE. Every bay is back and the description is gone again.
 *
 * That is the tutorial. Where to go next:
 *
 *   - src/utils/edits.ts   once you have written the same edit twice, move it
 *                          out of the plugin. It becomes a plain function you
 *                          can unit test without a browser — see edits.test.ts
 *                          for both halves of that: asserting on what an edit
 *                          SAYS, and on what it DOES once applied.
 *   - src/plugins/examples/ the same ideas without the commentary.
 */
