import test from "node:test";
import assert from "node:assert/strict";
import { drawNames, parseNames } from "../src/draw.ts";
import { sanitizeLogos } from "../src/logos.ts";

test("logo storage preserves valid roster images and drops unsafe or removed entries", () => {
  const logo = "data:image/webp;base64,UklGRg==";
  assert.deepEqual(
    sanitizeLogos(
      {
        Alpha: logo,
        Removed: logo,
        Bravo: "javascript:alert(1)",
        Charlie: "data:image/svg+xml;base64,PHN2Zz4=",
      },
      ["Alpha", "Bravo", "Charlie"],
    ),
    { Alpha: logo },
  );
  assert.deepEqual(sanitizeLogos(null, ["Alpha"]), {});
  assert.deepEqual(sanitizeLogos([logo], ["Alpha"]), {});
  assert.deepEqual(
    sanitizeLogos({ Alpha: "data:image/png;base64," + "A".repeat(50000) }, [
      "Alpha",
    ]),
    {},
  );
});

test("parses pasted names, trims whitespace, and removes case-insensitive duplicates", () => {
  assert.deepEqual(parseNames(" Alpha\nBravo,alpha; Charlie\n\n"), [
    "Alpha",
    "Bravo",
    "Charlie",
  ]);
});

test("guaranteed players appear once with unique random players in remaining slots", () => {
  const names = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot"];
  const fills = new Set<string>();
  for (let i = 0; i < 100; i++) {
    const result = drawNames(names, 4, ["Bravo", "Echo"]);
    assert.equal(result.length, 4);
    assert.equal(new Set(result).size, 4);
    assert.ok(result.includes("Bravo") && result.includes("Echo"));
    assert.ok(result.every((name) => names.includes(name)));
    fills.add(
      result
        .filter((name) => !["Bravo", "Echo"].includes(name))
        .sort()
        .join(","),
    );
  }
  assert.ok(fills.size > 1);
});

test("supports a single player, a full roster, and fully guaranteed draws", () => {
  assert.deepEqual(drawNames(["Solo"], 1), ["Solo"]);
  assert.deepEqual(drawNames(["A", "B"], 2).sort(), ["A", "B"]);
  assert.deepEqual(drawNames(["A", "B", "C"], 2, ["A", "C"]).sort(), [
    "A",
    "C",
  ]);
});

test("rejects invalid counts, duplicate players, and invalid guarantees", () => {
  for (const count of [0, -1, 3, 1.5, NaN])
    assert.throws(() => drawNames(["A", "B"], count));
  assert.throws(() => drawNames(["A", "a"], 1));
  assert.throws(() => drawNames([""], 1));
  assert.throws(() => drawNames(["A", "B"], 1, ["A", "B"]));
  assert.throws(() => drawNames(["A", "B"], 1, ["C"]));
});
