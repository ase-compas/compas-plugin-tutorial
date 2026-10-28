import type { Remove } from "@openscd/oscd-api";
import { newEditEventV2 } from "@openscd/oscd-api/utils.js";

/** The color variables the distro theme provides */
const colors = [
    'primary', 'secondary', 'error',
    'base03', 'base02', 'base01', 'base00',
    'base0', 'base1', 'base2', 'base3',
];

/** Theming: style the plugin with the distro's --oscd-theme-* variables */
const styles = `
    :host {
        /* 1. Map the distro theme to internal variables, with fallbacks */
        --oscd-primary: var(--oscd-theme-primary, #2aa198);
        --oscd-secondary: var(--oscd-theme-secondary, #6c71c4);
        --oscd-error: var(--oscd-theme-error, #dc322f);
        --oscd-base03: var(--oscd-theme-base03, #002b36);
        --oscd-base02: var(--oscd-theme-base02, #073642);
        --oscd-base01: var(--oscd-theme-base01, #586e75);
        --oscd-base00: var(--oscd-theme-base00, #657b83);
        --oscd-base0: var(--oscd-theme-base0, #839496);
        --oscd-base1: var(--oscd-theme-base1, #93a1a1);
        --oscd-base2: var(--oscd-theme-base2, #eee8d5);
        --oscd-base3: var(--oscd-theme-base3, #fdf6e3);
        --oscd-shape: var(--oscd-theme-shape, 8px);
        --oscd-text-font: var(--oscd-theme-text-font, 'Roboto');
        --oscd-text-font-mono: var(--oscd-theme-text-font-mono, 'Roboto Mono');

        /* 2. Only use the internal variables from here on, never hardcode */
        display: block;
        padding: 24px 0 0 24px;
        font-family: var(--oscd-text-font);
        color: var(--oscd-base00);
    }

    h1 {
        color: var(--oscd-primary);
    }

    h2 {
        color: var(--oscd-base01);
        font-size: 1rem;
        margin: 24px 0 8px;
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
        margin: 0;
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

    /* Theme overview: one swatch per color variable */
    .swatch {
        display: flex;
        flex-direction: column;
        width: 120px;
        padding: 0;
        border-left: none;
        overflow: hidden;
        font-size: 0.8rem;
    }

    .swatch::before {
        content: '';
        height: 48px;
        background: var(--swatch);
    }

    .swatch span {
        padding: 4px 8px;
    }

    .swatch .value {
        color: var(--oscd-base01);
        padding-top: 0;
    }

    .fonts li span {
        display: block;
        font-size: 0.8rem;
        color: var(--oscd-base01);
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

    /** The value a variable currently resolves to: theme value or fallback */
    resolve(name: string) {
        return getComputedStyle(this).getPropertyValue(name).trim();
    }

    renderStyles() {
        const style = document.createElement('style');
        style.textContent = styles;
        return style;
    }

    renderHeading(text: string, level = 'h2') {
        const heading = document.createElement(level);
        heading.textContent = text;
        return heading;
    }

    renderColorSwatches() {
        const list = document.createElement('ul');
        list.innerHTML = colors
            .map((color) => `
                <li class="swatch" style="--swatch: var(--oscd-${color})">
                    <span>--oscd-${color}</span>
                    <span class="value">${this.resolve(`--oscd-${color}`)}</span>
                </li>`)
            .join('');
        return list;
    }

    renderFontsAndShape() {
        const list = document.createElement('ul');
        list.className = 'fonts';
        list.innerHTML = `
            <li style="font-family: var(--oscd-text-font)">
                The quick brown fox
                <span>--oscd-text-font: ${this.resolve('--oscd-text-font')}</span>
            </li>
            <li>
                The quick brown fox
                <span>--oscd-text-font-mono: ${this.resolve('--oscd-text-font-mono')}</span>
            </li>
            <li>
                Rounded corners
                <span>--oscd-shape: ${this.resolve('--oscd-shape')}</span>
            </li>`;
        return list;
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

    renderTheme() {
        return [
            this.renderHeading('Colors'),
            this.renderColorSwatches(),
            this.renderHeading('Fonts & shape'),
            this.renderFontsAndShape(),
        ];
    }

    render() {
        if (!this.#doc) {
            this.#root.replaceChildren(
                this.renderStyles(),
                this.renderHeading('No document provided.', 'h1'),
                ...this.renderTheme(),
            );
            return;
        }

        const ieds = Array.from(this.#doc.querySelectorAll('IED'));
        this.#root.replaceChildren(
            this.renderStyles(),
            this.renderRemoveAllButton(),
            this.renderHeading('IEDs'),
            this.renderIedList(ieds),
            ...this.renderTheme(),
        );
    }
}
