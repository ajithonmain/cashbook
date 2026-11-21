import type { Book } from "./types";

export const ICON_KEYS = [
  // original 16 (stored in synced data: never rename or remove a key)
  "book",
  "wallet",
  "store",
  "home",
  "car",
  "plane",
  "bag",
  "food",
  "heart",
  "briefcase",
  "cap",
  "gift",
  "coins",
  "bolt",
  "phone",
  "chart",
  // added later
  "cart",
  "coffee",
  "bus",
  "fuel",
  "pill",
  "paw",
  "tv",
  "music",
  "dumbbell",
  "wrench",
  "camera",
  "laptop",
  "receipt",
  "card",
  "piggy",
  "shield",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

/** Preset hues offered in the color picker (HSL hue, 0-359). The picker also has a free hue slider. */
export const SWATCH_HUES = [0, 14, 28, 44, 64, 84, 110, 145, 165, 185, 200, 215, 230, 255, 275, 295, 320, 342] as const;

/** FNV-1a over the lowercased name, so the same name always gets the same color. */
export function hashHue(name: string): number {
  let h = 0x811c9dc5;
  for (const ch of name.trim().toLowerCase()) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % 360;
}

// Order matters: the first match wins, so specific words come before general ones.
/** Shortest distance between two hues on the color wheel (0 to 180). */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

/**
 * Auto color: the hue nearest to the name-derived one that no other book uses. It keeps a minimum gap
 * from every used hue so two books never look alike, and relaxes the gap only when there are very many
 * books. The result is deterministic for a given name and set of used hues.
 */
export function pickAutoHue(name: string, used: readonly number[]): number {
  const preferred = hashHue(name);
  for (const gap of [28, 20, 14, 10, 6, 3, 1]) {
    for (let offset = 0; offset <= 180; offset++) {
      for (const sign of offset === 0 ? [1] : [1, -1]) {
        const hue = (preferred + sign * offset + 360) % 360;
        if (used.every((u) => hueDistance(hue, u) >= gap)) return hue;
      }
    }
  }
  return preferred; // every hue is taken (more than 360 books)
}

const KEYWORDS: [IconKey, RegExp][] = [
  ["fuel", /fuel|petrol|diesel|gas station/],
  ["car", /\bcar\b|vehicle|bike|auto/],
  ["shield", /insurance|policy|premium/],
  ["pill", /medicine|pharmacy|pill/],
  ["heart", /health|medical|doctor|hospital/],
  ["paw", /\b(pet|pets|dog|cat|vet)\b/],
  ["tv", /\b(tv|dth|cable)\b|netflix|stream/],
  ["music", /music|concert|spotify/],
  ["dumbbell", /gym|fitness|workout/],
  ["wrench", /repair|maintenance|tools|garage/],
  ["camera", /photo|camera/],
  ["laptop", /laptop|computer|freelance|software|tech/],
  ["receipt", /\btax\b|invoice|receipt|expense/],
  ["card", /credit|debit|\bcard\b/],
  ["piggy", /piggy|saving/],
  ["coins", /invest|fund|bank|loan/],
  ["cart", /grocer|supermarket|cart/],
  ["coffee", /coffee|cafe|\btea\b|snack/],
  ["food", /food|restaurant|meal|kitchen|dining/],
  ["bag", /shopping|mall|cloth|fashion/],
  ["store", /shop|store|sales|business|market/],
  ["plane", /trip|travel|vacation|holiday|tour|goa|flight/],
  ["bus", /\bbus\b|metro|train|commute|transport/],
  ["home", /home|house|rent|flat|apartment/],
  ["briefcase", /work|office|salary|job|client/],
  ["cap", /school|college|study|tuition|education|fees/],
  ["gift", /gift|wedding|party|birthday|festival/],
  ["bolt", /bill|utility|utilities|electric|power|water/],
  ["phone", /phone|mobile|recharge|subscription/],
  ["wallet", /personal|wallet|cash|pocket|daily/],
];

export function suggestIcon(name: string): IconKey {
  const n = name.toLowerCase();
  return KEYWORDS.find(([, re]) => re.test(n))?.[0] ?? "book";
}

export function isIconKey(v: unknown): v is IconKey {
  return typeof v === "string" && (ICON_KEYS as readonly string[]).includes(v);
}

/** Resolved look of a book; books saved before this feature fall back to name-derived values. */
export function styleOf(book: Pick<Book, "name" | "icon" | "color">): { icon: IconKey; hue: number } {
  return {
    icon: isIconKey(book.icon) ? book.icon : suggestIcon(book.name),
    hue: typeof book.color === "number" ? book.color : hashHue(book.name),
  };
}
