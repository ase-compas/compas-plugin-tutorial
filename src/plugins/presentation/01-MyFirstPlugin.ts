
export default class MyFirstPlugin extends HTMLElement {

    connectedCallback() {

        this.innerHTML = '<h1>Hello World 👋!</h1>';

    }

}