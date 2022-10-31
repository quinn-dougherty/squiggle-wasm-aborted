open Jest
open TestHelpers
open FastCheck
open Arbitrary
open Property.Sync

let prepareInputs = (ar, minWeight) =>
  E.A.Floats.Sorted.splitContinuousAndDiscreteForMinWeight(ar, ~minDiscreteWeight=minWeight)

describe("Continuous and discrete splits", () => {
  makeTest(
    "is empty, with no common elements",
    prepareInputs([1.33455, 1.432, 2.0], 2),
    ([1.33455, 1.432, 2.0], []),
  )

  makeTest(
    "only stores 3.5 as discrete when minWeight is 3",
    prepareInputs([1.33455, 1.432, 2.0, 2.0, 3.5, 3.5, 3.5], 3),
    ([1.33455, 1.432, 2.0, 2.0], [(3.5, 3)]),
  )

  makeTest(
    "doesn't store 3.5 as discrete when minWeight is 5",
    prepareInputs([1.33455, 1.432, 2.0, 2.0, 3.5, 3.5, 3.5], 5),
    ([1.33455, 1.432, 2.0, 2.0, 3.5, 3.5, 3.5], []),
  )

  makeTest(
    "more general test",
    prepareInputs([10., 10., 11., 11., 11., 12., 13., 13., 13., 13., 13., 14.], 3),
    ([10., 10., 12., 14.], [(11., 3), (13., 5)]),
  )

  let makeDuplicatedArray = count => {
    let arr = Belt.Array.range(1, count)->E.A.fmap(float_of_int)
    let sorted = arr->Belt.SortArray.stableSortBy(compare)
    E.A.concatMany([sorted, sorted, sorted, sorted])->Belt.SortArray.stableSortBy(compare)
  }

  let (_, discrete1) = E.A.Floats.Sorted.splitContinuousAndDiscreteForMinWeight(
    makeDuplicatedArray(10),
    ~minDiscreteWeight=2,
  )
  makeTest("splitMedium at count=10", discrete1->E.A.length, 10)

  let (_c, discrete2) = E.A.Floats.Sorted.splitContinuousAndDiscreteForMinWeight(
    makeDuplicatedArray(500),
    ~minDiscreteWeight=2,
  )
  makeTest("splitMedium at count=500", discrete2->E.A.length, 500)
  // makeTest("foo", [] -> E.A.length, 500)

  // Function for fast-check property testing
  let testSegments = (counts, weight) => {
    // Make random-length segments, join them, and split continuous/discrete
    let random = _ => 0.01 +. Js.Math.random() // random() can produce 0
    let values = counts->E.A.length->E.A.makeBy(random)->E.A.Floats.cumSum
    let segments = Belt.Array.zipBy(counts, values, Belt.Array.make)
    let result = prepareInputs(segments->E.A.concatMany, weight)

    // Then split based on the segment length directly
    let (contSegments, discSegments) = segments->Belt.Array.partition(s => E.A.length(s) < weight)
    let expect = (
      contSegments->E.A.concatMany,
      discSegments->E.A.fmap(a => (E.A.unsafe_get(a, 0), E.A.length(a))),
    )

    makeTest("fast-check testing", result, expect)
    true
  }

  // rescript-fast-check's integerRange is broken, so we have to use nat plus a minimum
  let testSegmentsCorrected = (counts, weight) =>
    testSegments(counts->E.A.fmap(c => 1 + c), weight + 2)
  assert_(
    property2(
      Combinators.arrayWithLength(nat(~max=30, ()), 0, 50),
      nat(~max=20, ()),
      testSegmentsCorrected,
    ),
  )
})
