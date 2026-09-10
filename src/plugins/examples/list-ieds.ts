import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

/**
 * Lists every IED in the document. Click one to rename it.
 */
export default class ListIeds extends HTMLElement {
  #doc?: XMLDocument;

  set doc(doc: XMLDocument) {
    this.#doc = doc;
    this.render();
  }

  set editCount(_count: number) {
    this.render();
  }

  rename(ied: Element, name: string) {
    this.dispatchEvent(
      newEditEventV2(
        { element: ied, attributes: { name }, attributesNS: {} },
        { title: `Rename IED ${ied.getAttribute('name')} to ${name}` },
      ),
    );
  }

  render() {
    const ieds = [...(this.#doc?.querySelectorAll('IED') ?? [])];

    if (!ieds.length) {
      this.innerHTML = '<p>Open a document with an IED.</p>';
      return;
    }

    this.innerHTML = `<ul>${ieds
      .map(ied => `<li><button>${ied.getAttribute('name')}</button></li>`)
      .join('')}</ul>`;

    this.querySelectorAll<HTMLButtonElement>('button').forEach((button, i) => {
      button.onclick = () => {
        const name = prompt('New IED name', button.textContent ?? '');
        if (name) this.rename(ieds[i], name);
      };
    });
  }
}
