import type { Remove } from "@openscd/oscd-api";
import { newEditEventV2 } from "@openscd/oscd-api/utils.js";

/** Edit API Complex Edit: remove all IEDs */
export default class MyFirstPlugin extends HTMLElement {
    #doc?: XMLDocument;

    connectedCallback() {
        this.render();
    }

    set doc(doc: XMLDocument) {
        this.#doc = doc;
        this.render();
    }

    set editCount(_: number) {
        this.render();
    }

    removeAllIeds() {
        const ieds = Array.from(this.#doc?.querySelectorAll('IED') ?? []);

        // Option 1: one edit event per IED in a loop
        // -> every IED is its own entry in the history, undo restores them one by one
        for (const ied of ieds) {
            const event: Remove = {
                node: ied, // The IED element to be removed
            };

            this.dispatchEvent(
                newEditEventV2(event, { title: `Removing IED ${ied.getAttribute('name')}` }),
            );
        }

        // Option 2: one complex edit (an array of edits) in a single event
        // -> all IEDs are removed in one step, a single undo restores all of them
        //  const events: Remove[] = ieds.map((ied) => ({
        //      node: ied, // The IED element to be removed
        //  }));

        //  this.dispatchEvent(
        //      newEditEventV2(events, { title: `Removing all ${ieds.length} IEDs` }),
        //  );
    }

    renderRemoveAllButton() {
        const button = document.createElement('button');
        button.textContent = 'Remove all IEDs';
        button.addEventListener('click', () => this.removeAllIeds());
        return button;
    }

    renderIedList(ieds: Element[]) {
        const list = document.createElement('ul');
        list.innerHTML = ieds
            .map((ied) => `<li>${ied.getAttribute('name')}</li>`)
            .join('');
        return list;
    }

    render() {
        if (!this.#doc) {
            this.innerHTML = `<h1>No document provided.</h1>`;
            return;
        }

        const ieds = Array.from(this.#doc.querySelectorAll('IED'));
        this.replaceChildren(this.renderRemoveAllButton(), this.renderIedList(ieds));
    }
}
