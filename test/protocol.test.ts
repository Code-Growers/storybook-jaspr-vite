import { describe, expect, test } from "bun:test";
import { checkRecord, checkRuntime } from "../src/protocol.js";

describe("browser protocol", () => {
  test("accepts JSON data including a shared object without mistaking it for a cycle", () => {
    const shared = { label: "Save" };
    const args = { items: [shared, shared], disabled: false, nullable: null };
    expect(checkRecord(args, "args")).toEqual(args);
  });

  test("rejects data that would lose information across Dart interop", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    for (const input of [
      null,
      [],
      { onClick: () => {} },
      { date: new Date() },
      { count: NaN },
      circular,
    ]) {
      expect(() => checkRecord(input, "args")).toThrow();
    }
  });

  test("normalizes optional Storybook globals and arguments using JSON conventions", () => {
    expect(
      checkRecord(
        { backgrounds: { value: undefined }, values: [undefined] },
        "globals",
      ),
    ).toEqual({ backgrounds: {}, values: [null] });
  });

  test("rejects mismatched or incomplete Dart runtimes", () => {
    const runtime = {
      protocolVersion: 1 as const,
      async mount() {},
      async update() {},
      unmount() {},
    };
    expect(checkRuntime(runtime)).toBe(runtime);
    expect(() => checkRuntime({ ...runtime, protocolVersion: 2 })).toThrow(
      "matching",
    );
    expect(() => checkRuntime({ protocolVersion: 1 })).toThrow("matching");
    expect(() => checkRuntime(undefined)).toThrow("matching");
  });
});
