import type { Insert } from "@openscd/oscd-api";
import { newEditEventV2 } from "@openscd/oscd-api/utils.js";

/** Edit API Insert IED */
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

    insertIed() {
        const scl = this.#doc?.querySelector('SCL');
        if (!this.#doc || !scl) return;

        // Create a new, empty IED element in the SCL namespace
        const newName = `IED_${this.#doc.querySelectorAll('IED').length + 1}`;
        const ied = this.#doc.createElementNS(scl.namespaceURI, 'IED');
        ied.setAttribute('name', newName);

        const event: Insert = {
            parent: scl, // The element the new IED is added to
            node: ied, // The new IED element to be inserted
            reference: scl.querySelector(':scope > DataTypeTemplates'), // Insert before this node (null = append at the end)
        };

        this.dispatchEvent(
            newEditEventV2(event, { title: `Inserting IED ${newName}` }),
        );
    }

    renderInsertButton() {
        const button = document.createElement('button');
        button.textContent = 'Insert IED';
        button.addEventListener('click', () => this.insertIed());
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
        this.replaceChildren(this.renderInsertButton(), this.renderIedList(ieds));
    }
}
