import { Normal } from "../../src/dist/SymbolicDist.js";
import {
  frBool,
  frDate,
  frDistOrNumber,
  frDist,
  frNumber,
  frString,
  frTimeDuration,
  frArray,
  frTuple2,
  frDict,
  frRecord,
  frOptional,
} from "../../src/library/registry/frTypes.js";
import { NamespaceMap } from "../../src/reducer/bindings.js";

import {
  Value,
  vArray,
  vBool,
  vDate,
  vDist,
  vNumber,
  vRecord,
  vString,
  vTimeDuration,
} from "../../src/value/index.js";

test("frNumber", () => {
  const value = vNumber(5);
  expect(frNumber.unpack(value)).toBe(5);
  expect(frNumber.pack(5)).toEqual(value);
});

test("frString", () => {
  const value = vString("foo");
  expect(frString.unpack(value)).toBe("foo");
  expect(frString.pack("foo")).toEqual(value);
});

test("frBool", () => {
  const value = vBool(true);
  expect(frBool.unpack(value)).toBe(true);
  expect(frBool.pack(true)).toEqual(value);
});

test("frDate", () => {
  const date = new Date();
  const value = vDate(date);
  expect(frDate.unpack(value)).toBe(date);
  expect(frDate.pack(date)).toEqual(value);
});

test("frTimeDuration", () => {
  const duration = 1234;
  const value = vTimeDuration(duration);
  expect(frTimeDuration.unpack(value)).toBe(duration);
  expect(frTimeDuration.pack(duration)).toEqual(value);
});

describe("frDistOrNumber", () => {
  test("number", () => {
    const number = 123;
    const value = vNumber(number);
    expect(frDistOrNumber.unpack(value)).toBe(number);
    expect(frDistOrNumber.pack(number)).toEqual(value);
  });

  test("dist", () => {
    const dResult = Normal.make({ mean: 2, stdev: 5 });
    if (!dResult.ok) {
      fail("oops");
    }
    const dist = dResult.value;
    const value = vDist(dist);
    expect(frDistOrNumber.unpack(value)).toBe(dist);
    expect(frDistOrNumber.pack(dist)).toEqual(value);
  });
});

describe("frDist", () => {
  const dResult = Normal.make({ mean: 2, stdev: 5 });
  if (!dResult.ok) {
    fail("oops");
  }
  const dist = dResult.value;
  const value = vDist(dist);
  expect(frDist.unpack(value)).toBe(dist);
  expect(frDist.pack(dist)).toEqual(value);
});

test.todo("frLambda");
test.todo("frScale");

test("frArray", () => {
  const arr = [3, 5, 6];
  const value = vArray(arr.map((i) => vNumber(i)));
  expect(frArray(frNumber).unpack(value)).toEqual(arr);
  expect(frArray(frNumber).pack(arr)).toEqual(value);
});

test("frTuple2", () => {
  const arr = [3, "foo"] as [number, string];
  const value = vArray([vNumber(arr[0]), vString(arr[1])]);
  expect(frTuple2(frNumber, frString).unpack(value)).toEqual(arr);
  expect(frTuple2(frNumber, frString).pack(arr)).toEqual(value);
});

test("frDict", () => {
  const dict = NamespaceMap([
    ["foo", 5],
    ["bar", 6],
  ]);
  const value = vRecord(
    NamespaceMap([
      ["foo", vNumber(dict.get("foo")!)],
      ["bar", vNumber(dict.get("bar")!)],
    ])
  );
  expect(frDict(frNumber).unpack(value)).toEqual(dict);
  expect(frDict(frNumber).pack(dict)).toEqual(value);
});

describe("frRecord", () => {
  test("two keys", () => {
    const record = {
      foo: 5,
      bar: "hello",
    };
    const v = vRecord(
      NamespaceMap<string, Value>([
        ["foo", vNumber(record.foo)],
        ["bar", vString(record.bar)],
      ])
    );
    const t = frRecord(["foo", frNumber], ["bar", frString]);

    expect(t.unpack(v)).toEqual(record);
    expect(t.pack(record)).toEqual(v);
  });

  test("with optionals", () => {
    const record = {
      foo: 5,
      bar: "hello",
    };
    const v = vRecord(
      NamespaceMap<string, Value>([
        ["foo", vNumber(record.foo)],
        ["bar", vString(record.bar)],
      ])
    );
    const t = frRecord(
      ["foo", frNumber],
      ["bar", frString],
      ["baz", frOptional(frString)]
    );

    expect(t.unpack(v)).toEqual(record);
    expect(t.pack({ ...record, baz: null })).toEqual(v);
  });
});