import type { Remove } from "@openscd/oscd-api";
import { newEditEventV2 } from "@openscd/oscd-api/utils.js";

/** Theming: style the plugin with the distro's --oscd-theme-* variables */
const styles = `
    :host {
        /* 1. Map the distro theme to internal variables, with fallbacks */
        --oscd-primary: var(--oscd-theme-primary, #2aa198);
        --oscd-error: var(--oscd-theme-error, #dc322f);
        --oscd-base00: var(--oscd-theme-base00, #657b83);
        --oscd-base2: var(--oscd-theme-base2, #eee8d5);
        --oscd-base3: var(--oscd-theme-base3, #fdf6e3);
        --oscd-shape: var(--oscd-theme-shape, 8px);
        --oscd-text-font: var(--oscd-theme-text-font, 'Roboto');
        --oscd-text-font-mono: var(--oscd-theme-text-font-mono, 'Roboto Mono');

        /* 2. Only use the internal variables from here on, never hardcode */
        display: block;
        font-family: var(--oscd-text-font);
        color: var(--oscd-base00);
    }

    h1 {
        color: var(--oscd-primary);
    }

    button {
        font-family: var(--oscd-text-font);
        background: var(--oscd-error);
        color: var(--oscd-base3);
        border: none;
        border-radius: var(--oscd-shape);
        padding: 8px 16px;
        cursor: pointer;
    }

    ul {
        list-style: none;
        padding: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    li {
        font-family: var(--oscd-text-font-mono);
        background: var(--oscd-base2);
        border-left: 4px solid var(--oscd-primary);
        border-radius: var(--oscd-shape);
        padding: 8px 12px;
    }
`;

export default class MyFirstPlugin extends HTMLElement {
    #doc?: XMLDocument;

    // A shadow root scopes the styles to this plugin, and makes :host work
    #root = this.attachShadow({ mode: 'open' });

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
        const events: Remove[] = ieds.map((ied) => ({
            node: ied, // The IED element to be removed
        }));

        this.dispatchEvent(
            newEditEventV2(events, { title: `Removing all ${ieds.length} IEDs` }),
        );
    }

    renderStyles() {
        const style = document.createElement('style');
        style.textContent = styles;
        return style;
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
            const heading = document.createElement('h1');
            heading.textContent = 'No document provided.';
            this.#root.replaceChildren(this.renderStyles(), heading);
            return;
        }

        const ieds = Array.from(this.#doc.querySelectorAll('IED'));
        this.#root.replaceChildren(
            this.renderStyles(),
            this.renderRemoveAllButton(),
            this.renderIedList(ieds),
        );
    }
}
