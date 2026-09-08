/**
 * The smallest plugin. Just a custom element that can be used in HTML.
 *
 */
export default class HelloWorld extends HTMLElement {

  connectedCallback() {
    this.innerHTML = '<p>Hello, world!</p>';
  }

}
