function e(e,t){return new CustomEvent(`oscd-edit-v2`,{composed:!0,bubbles:!0,detail:{...t,edit:e}})}var t=[`primary`,`secondary`,`error`,`base03`,`base02`,`base01`,`base00`,`base0`,`base1`,`base2`,`base3`],n=`
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
`,r=class extends HTMLElement{#e;#t=this.attachShadow({mode:`open`});connectedCallback(){this.render()}set doc(e){this.#e=e,this.render()}set editCount(e){this.render()}removeAllIeds(){let t=Array.from(this.#e?.querySelectorAll(`IED`)??[]),n=t.map(e=>({node:e}));this.dispatchEvent(e(n,{title:`Removing all ${t.length} IEDs`}))}resolve(e){return getComputedStyle(this).getPropertyValue(e).trim()}renderStyles(){let e=document.createElement(`style`);return e.textContent=n,e}renderHeading(e,t=`h2`){let n=document.createElement(t);return n.textContent=e,n}renderColorSwatches(){let e=document.createElement(`ul`);return e.innerHTML=t.map(e=>`
                <li class="swatch" style="--swatch: var(--oscd-${e})">
                    <span>--oscd-${e}</span>
                    <span class="value">${this.resolve(`--oscd-${e}`)}</span>
                </li>`).join(``),e}renderFontsAndShape(){let e=document.createElement(`ul`);return e.className=`fonts`,e.innerHTML=`
            <li style="font-family: var(--oscd-text-font)">
                The quick brown fox
                <span>--oscd-text-font: ${this.resolve(`--oscd-text-font`)}</span>
            </li>
            <li>
                The quick brown fox
                <span>--oscd-text-font-mono: ${this.resolve(`--oscd-text-font-mono`)}</span>
            </li>
            <li>
                Rounded corners
                <span>--oscd-shape: ${this.resolve(`--oscd-shape`)}</span>
            </li>`,e}renderRemoveAllButton(){let e=document.createElement(`button`);return e.textContent=`Remove all IEDs`,e.addEventListener(`click`,()=>this.removeAllIeds()),e}renderIedList(e){let t=document.createElement(`ul`);return t.innerHTML=e.map(e=>`<li>${e.getAttribute(`name`)}</li>`).join(``),t}renderTheme(){return[this.renderHeading(`Colors`),this.renderColorSwatches(),this.renderHeading(`Fonts & shape`),this.renderFontsAndShape()]}render(){if(!this.#e){this.#t.replaceChildren(this.renderStyles(),this.renderHeading(`No document provided.`,`h1`),...this.renderTheme());return}let e=Array.from(this.#e.querySelectorAll(`IED`));this.#t.replaceChildren(this.renderStyles(),this.renderRemoveAllButton(),this.renderHeading(`IEDs`),this.renderIedList(e),...this.renderTheme())}};export{r as default};