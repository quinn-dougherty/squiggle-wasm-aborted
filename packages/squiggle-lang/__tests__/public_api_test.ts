import { SqSymbolicDistribution } from "../src/public/SqDistribution";
import { SqDistributionValue } from "../src/public/SqValue";
import { testRun } from "./helpers/helpers";

describe("SqValue", () => {
  test("toJS", () => {
    const value = testRun(
      '{ x: 5, y: [3, "foo", { dist: normal(5,2) } ] }'
    ).asJS();

    expect(value).toBeInstanceOf(Map);
    expect((value as any).get("x")).toBe(5);
    expect((value as any).get("y")[2].get("dist")).toBeInstanceOf(
      SqSymbolicDistribution
    );
  });
});
