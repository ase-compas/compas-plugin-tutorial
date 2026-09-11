var e=class extends HTMLElement{connectedCallback(){this.innerHTML=`
      <h2>Hello from your first plugin</h2>
      <p>
        This plugin knows nothing about the document yet — it does not even
        have one. Open <code>scl/example.scd</code> with the button above and
        nothing here will change.
      </p>
      <p>Step 2 fixes that.</p>`}};export{e as default};