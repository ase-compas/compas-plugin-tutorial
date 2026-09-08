import type { EditEventV2, EditV2, Remove } from '@openscd/oscd-api';
import { newEditEventV2 } from '@openscd/oscd-api/utils.js';

/**
 * Reusable SCL edits.
 *
 * Each edit is built by a plain function that returns an `EditV2` value and
 * touches nothing. Applying it is somebody else's job — OpenSCD core's, or the
 * dev shell's. That split is what makes an edit unit-testable: you can assert
 * on the *description* of a change without a document, a host or a plugin, and
 * assert on its *effect* by handing it to an `XMLEditor`.
 *
 * @see edits.test.ts
 */

/**
 * Intent to remove every element in `elements`.
 *
 * An `EditV2` may be an array of edits — a "complex" edit. OpenSCD applies the
 * whole array as a single entry in the undo history, so removing twenty
 * elements still costs the user exactly one undo.
 */
export function removeElements(elements: Element[]): Remove[] {
  return elements.map(node => ({ node }));
}

/**
 * The edit event for {@link removeElements}, labelled for the history.
 *
 * `historyMessage` becomes the commit's `title`: the line the user reads in
 * OpenSCD's history, so write it for them ("Delete 3 IEDs"), not for yourself.
 */
export function newRemoveElementsEvent(
  elements: Element[],
  historyMessage: string,
): EditEventV2<EditV2> {
  return newEditEventV2<EditV2>(removeElements(elements), {
    title: historyMessage,
  });
}
