import type { Remove, SetAttributes } from "@openscd/oscd-api";
import { newEditEventV2 } from "@openscd/oscd-api/utils.js";

export default class MyFirstPlugin extends HTMLElement {
  #doc?: XMLDocument;

  set doc(doc: XMLDocument) {
    this.#doc = doc;
    this.render();
  }

  set editCount(_: number) {
    this.render();
  }

  renameIed(ied: Element, newName: string) {
    const event: SetAttributes = {
      element: ied, // The IED element to be renamed
      attributes: { name: newName }, // Set the attribute name to newName
      attributesNS: {},
    };

    this.dispatchEvent(
      newEditEventV2(event, { title: `Renaming IED to ${newName}` }),
    );
  }

  removeIed(ied: Element) {
    const event: Remove = {
      node: ied, // The IED element to be removed
    };

    this.dispatchEvent(
      newEditEventV2(event, { title: `Removing IED ${ied.getAttribute('name')}` }),
    );
  }


  render() {
    if (!this.#doc) {
      this.innerHTML = `<h1>No document provided.</h1>`;
      return;
    }

    const ieds = Array.from(this.#doc.querySelectorAll('IED'));

    this.innerHTML = `<ul>${ieds
      .map((ied, i) => `<li>${ied.getAttribute('name')}
        <button data-action="rename" data-index="${i}">Rename</button>
        <button data-action="remove" data-index="${i}">Remove</button>
      </li>`)
      .join('')}</ul>`;

    this.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        const ied = ieds[Number(button.dataset.index)];

        if (button.dataset.action === 'remove') {
          this.removeIed(ied);
          return;
        }

        // Ask for a new name in a browser dialog and rename the IED
        const newName = prompt('New IED name:', ied.getAttribute('name') ?? '');
        if (newName) this.renameIed(ied, newName);
      });
    });
  }
}
