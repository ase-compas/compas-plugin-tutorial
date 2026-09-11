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


  promptRename(ied: Element) {
    // Ask for a new name in a browser dialog and rename the IED
    const newName = prompt('New IED name:', ied.getAttribute('name') ?? '');
    if (newName) this.renameIed(ied, newName);
  }

  renderButton(label: string, onClick: () => void) {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  renderIed(ied: Element) {
    const item = document.createElement('li');
    item.append(
      `${ied.getAttribute('name')} `,
      this.renderButton('Rename', () => this.promptRename(ied)),
      this.renderButton('Remove', () => this.removeIed(ied)),
    );
    return item;
  }

  renderIedList(ieds: Element[]) {
    const list = document.createElement('ul');
    list.append(...ieds.map((ied) => this.renderIed(ied)));
    return list;
  }

  render() {
    if (!this.#doc) {
      this.innerHTML = `<h1>No document provided.</h1>`;
      return;
    }

    const ieds = Array.from(this.#doc.querySelectorAll('IED'));
    this.replaceChildren(this.renderIedList(ieds));
  }
}
