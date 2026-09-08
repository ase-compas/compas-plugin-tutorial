import type { Insert } from '@openscd/oscd-api';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

/* =========================================================================
 * Step 4 — Adding elements: Insert
 * =========================================================================
 *
 * An Insert edit is the exact shape of the DOM call it stands for:
 *
 *   { parent, node, reference }   means   parent.insertBefore(node, reference)
 *
 *   parent      the element to insert into
 *   node        the node to insert — you create it, but do not attach it
 *   reference   insert before this sibling, or `null` to append at the end
 *
 * `reference` is the field worth understanding. SCL is order-sensitive: the
 * schema fixes the order of child elements, so appending is often wrong. Pass
 * the element the new one must come before.
 *
 * One trap deserves a warning of its own. SCL is a namespaced XML dialect, so
 * you must create elements with `createElementNS` and the SCL namespace:
 *
 *   doc.createElementNS('http://www.iec.ch/61850/2003/SCL', 'Bay')
 *
 * `doc.createElement('Bay')` looks like it works,  the element appears, your
 * plugin shows it,  but it lands in no namespace, `querySelector` results get
 * strange, and the file you save is invalid SCL.
 */

const SCL_NS = 'http://www.iec.ch/61850/2003/SCL';

export default class Step4Insert extends HTMLElement {
  #doc?: XMLDocument;

  set doc(doc: XMLDocument) {
    this.#doc = doc;
    this.render();
  }

  set editCount(_count: number) {
    this.render();
  }

  addBay(voltageLevel: Element) {
    const bay = this.#doc!.createElementNS(SCL_NS, 'Bay');
    bay.setAttribute('name', `Bay ${voltageLevel.querySelectorAll('Bay').length + 1}`);

    /*
     * Setting attributes on `bay` needs no edit event: the element is not in
     * the document yet, so there is nothing to undo. Build it freely, then let
     * a single Insert edit put the finished element in.
     */
    const edit: Insert = {
      parent: voltageLevel,
      node: bay,
      // insert before the first existing Bay; use `null` to append instead
      reference: voltageLevel.querySelector('Bay'),
    };

    this.dispatchEvent(
      newEditEventV2(edit, { title: `Add ${bay.getAttribute('name')}` }),
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
        <h3>${voltageLevel.getAttribute('name')}</h3>
        <ol>${[...voltageLevel.querySelectorAll('Bay')]
          .map(bay => `<li>${bay.getAttribute('name')}</li>`)
          .join('')}</ol>
        <button>Add a bay</button>`,
      )
      .join('');

    this.querySelectorAll<HTMLButtonElement>('button').forEach((button, i) => {
      button.onclick = () => this.addBay(voltageLevels[i]);
    });
  }
}

/*
 * Try it:
 *
 *   1. Add a few bays. Each one appears at the TOP of the list — that is
 *      `reference` at work.
 *   2. Change `reference` to `null`, save, and add another. It appends.
 *   3. Undo. OpenSCD inverts an Insert into a Remove for you.
 *
 * Next: 05-remove.ts — taking elements out.
 */
