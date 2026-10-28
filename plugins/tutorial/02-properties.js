var e=class extends HTMLElement{#e;#t;#n=`en`;set doc(e){this.#e=e,this.render()}set docName(e){this.#t=e,this.render()}set locale(e){this.#n=e,this.render()}set editCount(e){this.render()}set docVersion(e){this.render()}render(){if(!this.#e){this.innerHTML=`<p>Open a document to see its properties.</p>`;return}let e=e=>this.#e.querySelectorAll(e).length;this.innerHTML=`
      <h2>${this.#t}</h2>
      <dl>
        <dt>Root element</dt><dd>${this.#e.documentElement.tagName}</dd>
        <dt>Substations</dt><dd>${e(`Substation`)}</dd>
        <dt>IEDs</dt><dd>${e(`IED`)}</dd>
        <dt>Your locale</dt><dd>${this.#n}</dd>
      </dl>`}};export{e as default};