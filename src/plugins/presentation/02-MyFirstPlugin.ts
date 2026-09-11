export default class MyFirstPlugin extends HTMLElement {
  #doc?: XMLDocument;

  set doc(doc: XMLDocument) {
    this.#doc = doc;
    this.render();
  }

  set editCount(_: number) {
    this.render();
  }

  render() {
    if (!this.#doc) {
      this.innerHTML = `<h1>No document provided.</h1>`;
      return;
    }

    const ieds = Array.from(this.#doc.querySelectorAll('IED'));

    this.innerHTML = `<ul>${ieds
      .map((ied) => `<li>${ied.getAttribute('name')}</li>`)
      .join('')}</ul>`;
  }
}