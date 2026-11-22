import type { Book, BookSettings } from "./types";
import { CATEGORIES_IN, CATEGORIES_OUT, PAYMENT_MODES } from "./types";

export function defaultBookSettings(): BookSettings {
  return {
    categories: Array.from(new Set([...CATEGORIES_IN, ...CATEGORIES_OUT])),
    paymentModes: [...PAYMENT_MODES],
    categoryEnabled: true,
    categoryRequired: false,
    paymentModeEnabled: true,
    paymentModeRequired: false,
    partyEnabled: true,
    partyRequired: false,
    customFields: [],
  };
}

/** Books saved before per-book settings existed have none; they fall back to the legacy global lists. */
export function settingsOf(book: Pick<Book, "settings">): BookSettings {
  return book.settings ?? defaultBookSettings();
}
