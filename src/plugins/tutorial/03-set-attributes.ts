import type { SetAttributes } from '@openscd/oscd-api';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

/* =========================================================================
 * Step 3 — Changing the document: SetAttributes
 * =========================================================================
 *
 * Here is the rule that makes OpenSCD work:
 *
 *   A plugin never changes the document itself.
 *
 * You do NOT call `element.setAttribute(…)`. You describe the change you want
 * as an **edit**, dispatch it as an event, and OpenSCD applies it. In return
 * you get undo/redo, a history entry, and every other plugin finding out.
 * Mutate the XML yourself and you get none of that,  the change is invisible
 * to the app and cannot be undone.
 *
 * There are four kinds of edit. This step covers the first:
 *
 *   SetAttributes   set or remove attributes on an element   <- this step
 *   Insert          put a node into the tree                 (step 4)
 *   Remove          take a node out of the tree              (step 5)
 *   EditV2[]        several of the above, as one step        (step 6)
 *
 * A SetAttributes edit is a plain object:
 *
 *   {
 *     element:    the Element to change
 *     attributes: { name: 'NEW' }   // a value sets it, null REMOVES it
 *     attributesNs: { }
 *   }
 *
 * Note `null`: `{ desc: null }` deletes the `desc` attribute. That is how you
 * remove one. There is no separate edit type for it. For attributes in a
 * namespace there is an `attributesNS` field, keyed by namespace URI; you
 * rarely need it.
 */

export default class Step3SetAttributes extends HTMLElement {
  #doc?: XMLDocument;

  set doc(doc: XMLDocument) {
    this.#doc = doc;
    this.render();
  }

  set editCount(_count: number) {
    this.render();
  }

  /** Renames a substation, and clears its description while we are at it. */
  describe(substation: Element, name: string) {
    const edit: SetAttributes = {
      element: substation,
      attributes: {
        name, //        a string sets the attribute
        desc: null, //  null removes it
      },
      attributesNS: {},
    };

    /*
     * `newEditEventV2` wraps the edit in a bubbling, composed CustomEvent, so
     * it travels up out of your plugin to OpenSCD. The `title` is what the
     * user reads in the history,  write it for them.
     */
    this.dispatchEvent(newEditEventV2(edit, { title: `Rename to ${name}` }));

    /*
     * Nothing has changed yet at this point! The event has to travel up and be
     * applied first. Do not read the document here expecting the new value, 
     * wait for your `editCount` setter to fire and re-render there.
     */
  }

  render() {
    const substations = [...(this.#doc?.querySelectorAll('Substation') ?? [])];

    if (!substations.length) {
      this.innerHTML = '<p>Open a document with a Substation.</p>';
      return;
    }

    this.innerHTML = `<ul>${substations
      .map(
        substation =>
          `<li><button>${substation.getAttribute('name')}</button>
           <small>${substation.getAttribute('desc') ?? '(no description)'}</small></li>`,
      )
      .join('')}</ul>`;

    this.querySelectorAll<HTMLButtonElement>('button').forEach((button, i) => {
      button.onclick = () => {
        const name = prompt('New substation name', button.textContent ?? '');
        if (name) this.describe(substations[i], name);
      };
    });
  }
}

/*
 * Try it:
 *
 *   1. Open scl/example.scd and rename "Substation A". The name updates and
 *      the description disappears — one edit did both.
 *   2. Press undo. Both come back: OpenSCD worked out the inverse edit for
 *      you, because you described the change instead of performing it.
 *
 * Next: 04-insert.ts — adding elements.
 */
