import { describe, expect, it } from "vitest";
import { parseCsv, parseDateTime, parseEntriesCsv, withImportedOptions, withoutExisting } from "../src/lib/csvImport";
import { defaultBookSettings } from "../src/lib/bookSettings";
import { totalsOf } from "../src/lib/totals";

const HEADER = '"Date","Time","Remark","Entry by","Category","Mode","Cash In","Cash Out","Balance"';

function file(...rows: string[]): string {
  return [HEADER, ...rows].join("\n");
}

describe("parseCsv", () => {
  it("handles quoted commas, doubled quotes, newlines, CRLF and a BOM", () => {
    expect(parseCsv('﻿"a,b","say ""hi""",,"two\nlines"\r\nx,y\r\n')).toEqual([
      ["a,b", 'say "hi"', "", "two\nlines"],
      ["x", "y"],
    ]);
  });
});

describe("parseDateTime", () => {
  it("reads 12-hour times in local time", () => {
    expect(parseDateTime("02 January 2020", "4:05 pm")).toBe(new Date(2020, 0, 2, 16, 5).getTime());
    expect(parseDateTime("15 March 2020", "12:10 am")).toBe(new Date(2020, 2, 15, 0, 10).getTime());
    expect(parseDateTime("5 Sep 2021", "12:00 pm")).toBe(new Date(2021, 8, 5, 12, 0).getTime());
  });
  it("rejects impossible dates and times", () => {
    expect(parseDateTime("30 February 2024", "1:00 pm")).toBeNull();
    expect(parseDateTime("01 Smarch 2024", "1:00 pm")).toBeNull();
    expect(parseDateTime("01 March 2024", "13:00 pm")).toBeNull();
    expect(parseDateTime("2024-03-01", "1:00 pm")).toBeNull();
  });
});

describe("parseEntriesCsv", () => {
  it("maps columns by name, including entries with no category", () => {
    const { entries, skipped } = parseEntriesCsv(
      file(
        '"01 January 2020","9:00 am","Opening Balance","Someone","","Online",2000,,2000',
        '"01 January 2020","5:00 pm","rent, shared","Someone","Rent","Cash",,"1,500",500'
      )
    );
    expect(skipped).toEqual([]);
    expect(entries[0]).toMatchObject({ type: "in", amount: 2000, category: "", paymentMode: "Online" });
    expect(entries[1]).toMatchObject({ type: "out", amount: 1500, remarks: "rent, shared" });
    expect(totalsOf(entries)).toEqual({ totalIn: 2000, totalOut: 1500, net: 500 });
  });
  it("reports rows it cannot import with their spreadsheet row number", () => {
    const { entries, skipped } = parseEntriesCsv(
      file(
        '"03 February 2020","10:00 am","zero","S","","Online",,0,100',
        '"bad date","10:00 am","x","S","","Online",5,,1',
        "",
        '"03 February 2020","10:00 am","both","S","","Online",5,5,1',
        '"03 February 2020","10:00 am","text","S","","Online",abc,,1'
      )
    );
    expect(entries).toEqual([]);
    expect(skipped.map((s) => s.row)).toEqual([2, 3, 5, 6]);
  });
  it("truncates text to the server limits", () => {
    const { entries } = parseEntriesCsv(
      file(`"03 February 2020","10:00 am","${"r".repeat(600)}","S","${"c".repeat(80)}","${"m".repeat(50)}",5,,5`)
    );
    expect([entries[0].remarks.length, entries[0].category.length, entries[0].paymentMode.length]).toEqual([500, 60, 40]);
  });
  it("rejects a file without the expected columns", () => {
    expect(() => parseEntriesCsv("Name,Amount\nx,1")).toThrow();
    expect(() => parseEntriesCsv("")).toThrow();
  });
});

describe("withoutExisting", () => {
  const row = '"03 February 2020","10:00 am","tea","S","Food","Cash",,10,0';
  const { entries } = parseEntriesCsv(file(row, row));
  it("keeps identical rows when the book has neither", () => {
    expect(withoutExisting(entries, [])).toHaveLength(2);
  });
  it("skips as many as the book already has", () => {
    expect(withoutExisting(entries, entries.slice(0, 1))).toHaveLength(1);
    expect(withoutExisting(entries, entries)).toHaveLength(0);
  });
});

describe("withImportedOptions", () => {
  const { entries } = parseEntriesCsv(file('"03 February 2020","10:00 am","x","S","Snacks","Online",,10,0'));
  it("appends new categories once and leaves known payment modes alone", () => {
    const base = defaultBookSettings();
    const next = withImportedOptions(base, [...entries, ...entries]);
    expect(next?.categories).toEqual([...base.categories, "Snacks"]);
    expect(next?.paymentModes).toEqual(base.paymentModes);
  });
  it("returns null when nothing is new", () => {
    const settings = withImportedOptions(defaultBookSettings(), entries);
    expect(settings && withImportedOptions(settings, entries)).toBeNull();
  });
});
