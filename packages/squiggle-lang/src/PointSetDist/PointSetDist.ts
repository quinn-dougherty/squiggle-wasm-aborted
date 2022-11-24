import * as Continuous from "./Continuous";
import { ContinuousShape } from "./Continuous";
import * as Discrete from "./Discrete";
import { DiscreteShape } from "./Discrete";
import * as Mixed from "./Mixed";
import * as magicNumbers from "../magicNumbers";
import * as RSResult from "../rsResult";
import * as Sparklines from "./Sparklines";
import { MixedShape } from "./Mixed";
import { ConvolutionOperation, PointSet } from "./types";

//TODO WARNING: The combineAlgebraicallyWithDiscrete will break for subtraction and division, like, discrete - continous
export const combineAlgebraically = (
  op: ConvolutionOperation,
  t1: PointSet,
  t2: PointSet<any>
): PointSet => {
  if (t1 instanceof ContinuousShape && t2 instanceof ContinuousShape) {
    return makeContinuous(Continuous.combineAlgebraically(op, t1, t2));
  } else if (t1 instanceof DiscreteShape && t2 instanceof ContinuousShape) {
    return makeContinuous(
      Continuous.combineAlgebraicallyWithDiscrete(op, t2, t1, "First")
    );
  } else if (t1 instanceof ContinuousShape && t2 instanceof DiscreteShape) {
    return makeContinuous(
      Continuous.combineAlgebraicallyWithDiscrete(op, t1, t2, "Second")
    );
  } else if (t1 instanceof DiscreteShape && t2 instanceof DiscreteShape) {
    return makeDiscrete(Discrete.combineAlgebraically(op, t1, t2));
  } else {
    return makeMixed(
      Mixed.combineAlgebraically(op, t1.toMixed(), t2.toMixed())
    );
  }
};

export const combinePointwise = <E>(
  t1: PointSet,
  t2: PointSet,
  fn: (v1: number, v2: number) => RSResult.rsResult<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined,
  integralCachesFn: (
    s1: ContinuousShape,
    s2: ContinuousShape
  ) => ContinuousShape | undefined = () => undefined
): RSResult.rsResult<PointSet, E> => {
  if (t1 instanceof ContinuousShape && t2 instanceof ContinuousShape) {
    return RSResult.fmap(
      Continuous.combinePointwise(t1, t2, fn, undefined, integralSumCachesFn),
      (x) => makeContinuous(x)
    );
  } else if (t1 instanceof DiscreteShape && t2 instanceof DiscreteShape) {
    return RSResult.fmap(
      Discrete.combinePointwise(t1, t2, fn, integralSumCachesFn),
      (x) => makeDiscrete(x)
    );
  } else {
    return RSResult.fmap(
      Mixed.combinePointwise(
        t1.toMixed(),
        t2.toMixed(),
        fn,
        integralSumCachesFn,
        integralCachesFn
      ),
      (x) => makeMixed(x)
    );
  }
};

export const pdf = (f: number, t: PointSet) => {
  const mixedPoint = t.xToY(f);
  return mixedPoint.continuous + mixedPoint.discrete;
};

export const inv = (f: number, t: PointSet) => t.integralYtoX(f);
export const cdf = (f: number, t: PointSet) => t.integralXtoY(f);

export const sample = (t: PointSet): number => {
  let randomItem = Math.random();
  return t.integralYtoX(randomItem);
};

// let isFloat = (t: t) =>
//   switch t {
//   | Discrete(d) => Discrete.isFloat(d)
//   | _ => false
//   }

export const sampleNRendered = (dist: PointSet, n: number): number[] => {
  const integralCache = dist.integral();
  const distWithUpdatedIntegralCache = dist.updateIntegralCache(integralCache);
  const items: number[] = new Array(n).fill(0);
  for (let i = 0; i <= n - 1; i++) {
    items[i] = sample(distWithUpdatedIntegralCache);
  }
  return items;
};

export const toSparkline = (
  t: PointSet,
  bucketCount: number
): RSResult.rsResult<string, string> => {
  const continuous = t.toContinuous();
  if (!continuous) {
    return RSResult.Error(
      "Cannot find the sparkline of a discrete distribution"
    );
  }
  const downsampled = continuous.downsampleEquallyOverX(bucketCount);
  return RSResult.Ok(Sparklines.create(Continuous.getShape(downsampled).ys));
};

// deprecated
export const makeDiscrete = (d: DiscreteShape) => d;
export const makeContinuous = (d: ContinuousShape) => d;
export const makeMixed = (d: MixedShape) => d;

export const isContinuous = (d: PointSet): d is ContinuousShape =>
  d instanceof ContinuousShape;
export const isDiscrete = (d: PointSet): d is DiscreteShape =>
  d instanceof DiscreteShape;

export const expectedConvolutionCost = (d: PointSet): number => {
  if (isContinuous(d)) {
    return magicNumbers.OpCost.continuousCost;
  } else if (isDiscrete(d)) {
    return d.xyShape.xs.length;
  } else if (d instanceof MixedShape) {
    return magicNumbers.OpCost.mixedCost;
  }
  throw new Error(`Unknown PointSet ${d}`);
};
