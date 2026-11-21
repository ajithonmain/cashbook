import { describe, expect, it } from "vitest";
import { hashHue, hueDistance, ICON_KEYS, isIconKey, pickAutoHue, styleOf, suggestIcon, SWATCH_HUES } from "../src/lib/bookStyle";

describe("hashHue", () => {
  it("is stable, case-insensitive and within 0-359", () => {
    expect(hashHue("Personal")).toBe(hashHue("  personal "));
    for (const name of ["Shop", "Trip to Goa", "Rent", "", "日本"]) {
      const h = hashHue(name);
      expect(Number.isInteger(h) && h >= 0 && h < 360).toBe(true);
    }
  });

  it("gives different names different colors in practice", () => {
    const names = ["Personal", "Shop", "Trip to Goa", "Rent", "Savings", "Office", "Car", "Gifts"];
    expect(new Set(names.map(hashHue)).size).toBe(names.length);
  });
});

describe("suggestIcon", () => {
  it("matches keywords and falls back to the book icon", () => {
    expect(suggestIcon("Trip to Goa")).toBe("plane");
    expect(suggestIcon("My Shop")).toBe("store");
    expect(suggestIcon("Home rent")).toBe("home");
    expect(suggestIcon("Zzz")).toBe("book");
    expect(suggestIcon("Groceries")).toBe("cart");
    expect(suggestIcon("Shopping")).toBe("bag");
    expect(suggestIcon("Petrol")).toBe("fuel");
    expect(suggestIcon("Car loan")).toBe("car");
    expect(suggestIcon("Pet care")).toBe("paw");
    expect(suggestIcon("Gym")).toBe("dumbbell");
    expect(suggestIcon("Insurance")).toBe("shield");
  });
  it("only ever returns known icons", () => {
    for (const n of ["shop", "trip", "bill", "gift", "x", "tv", "vet", "tax"]) expect(isIconKey(suggestIcon(n))).toBe(true);
  });
});

describe("styleOf", () => {
  it("uses stored values, and derives them for books saved before icons existed", () => {
    expect(styleOf({ name: "Shop", icon: "gift", color: 222 })).toEqual({ icon: "gift", hue: 222 });
    expect(styleOf({ name: "Trip to Goa" })).toEqual({ icon: "plane", hue: hashHue("Trip to Goa") });
    expect(styleOf({ name: "X", icon: "not-an-icon", color: null }).icon).toBe("book");
  });
});

describe("palette", () => {
  it("has 32 unique icons and 18 valid unique swatch hues", () => {
    expect(new Set(ICON_KEYS).size).toBe(32);
    expect(new Set(SWATCH_HUES).size).toBe(18);
    expect(SWATCH_HUES.every((h) => h >= 0 && h < 360)).toBe(true);
  });
});

describe("pickAutoHue", () => {
  it("uses the name-derived hue when nothing nearby is taken", () => {
    expect(pickAutoHue("Personal", [])).toBe(hashHue("Personal"));
  });

  it("never returns a hue that another book already uses, and keeps them visibly apart", () => {
    const used: number[] = [];
    for (let i = 0; i < 12; i++) {
      const hue = pickAutoHue("Book", used); // identical names are the worst case
      expect(used.every((u) => hueDistance(hue, u) >= 28)).toBe(true);
      used.push(hue);
    }
  });

  it("stays unique even with a very large number of books", () => {
    const used: number[] = [];
    for (let i = 0; i < 150; i++) {
      const hue = pickAutoHue("x", used);
      expect(used.includes(hue)).toBe(false);
      used.push(hue);
    }
  });

  it("is deterministic and stays close to the preferred hue when possible", () => {
    const used = [hashHue("Trip")];
    expect(pickAutoHue("Trip", used)).toBe(pickAutoHue("Trip", used));
    expect(hueDistance(pickAutoHue("Trip", used), hashHue("Trip"))).toBeLessThanOrEqual(40);
  });
});
