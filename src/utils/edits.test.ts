import { beforeEach, expect, it } from 'vitest';

import type { EditDetailV2 } from '@openscd/oscd-api';
import { XMLEditor } from '@openscd/oscd-editor';

import { newRemoveElementsEvent, removeElements } from './edits.js';

const scl = `<SCL xmlns="http://www.iec.ch/61850/2003/SCL">
  <IED name="IED1"/>
  <IED name="IED2"/>
  <IED name="IED3"/>
</SCL>`;

let doc: XMLDocument;
let editor: XMLEditor;
let host: HTMLElement;

const iedNames = () =>
  [...doc.querySelectorAll('IED')].map(ied => ied.getAttribute('name'));

/**
 * Stands in for OpenSCD core: listens for the events a plugin dispatches and
 * applies them to the document, exactly as `src/dev-shell/shell.ts` does.
 */
beforeEach(() => {
  doc = new DOMParser().parseFromString(scl, 'application/xml');
  editor = new XMLEditor();
  host = document.createElement('div');
  host.addEventListener('oscd-edit-v2', ({ detail }: CustomEvent<EditDetailV2>) =>
    editor.commit(detail.edit, detail),
  );
  document.body.replaceChildren(host);
});

it('describes the removals without applying them', () => {
  // no host, no editor — an edit is just a value, so assert on it directly
  const edit = removeElements([...doc.querySelectorAll('IED')]);

  expect(edit).toEqual([
    { node: doc.querySelector('IED[name="IED1"]') },
    { node: doc.querySelector('IED[name="IED2"]') },
    { node: doc.querySelector('IED[name="IED3"]') },
  ]);
  expect(iedNames()).toEqual(['IED1', 'IED2', 'IED3']);
});

it('removes every element once the event is handled', () => {
  host.dispatchEvent(
    newRemoveElementsEvent([...doc.querySelectorAll('IED')], 'Delete 3 IEDs'),
  );

  expect(iedNames()).toEqual([]);
});

it('spends a single history entry on the whole list', () => {
  host.dispatchEvent(
    newRemoveElementsEvent([...doc.querySelectorAll('IED')], 'Delete 3 IEDs'),
  );

  expect(editor.past).toHaveLength(1);
  expect(editor.past[0].title).toBe('Delete 3 IEDs');
  expect(editor.past[0].redo).toHaveLength(3);
});

it('restores the elements where they were on undo', () => {
  const middle = doc.querySelector('IED[name="IED2"]')!;
  host.dispatchEvent(newRemoveElementsEvent([middle], 'Delete IED2'));
  expect(iedNames()).toEqual(['IED1', 'IED3']);

  editor.undo();

  // back in the middle, not appended at the end — which is why a plugin
  // dispatches an edit instead of calling `element.remove()` itself
  expect(iedNames()).toEqual(['IED1', 'IED2', 'IED3']);
});

it('does nothing when the list is empty', () => {
  host.dispatchEvent(newRemoveElementsEvent([], 'Delete nothing'));

  expect(iedNames()).toEqual(['IED1', 'IED2', 'IED3']);
});
