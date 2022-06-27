module BindingsReplacer = Reducer_Expression_BindingsReplacer
module ExpressionT = Reducer_Expression_T
module ExternalLibrary = ReducerInterface.ExternalLibrary
module Lambda = Reducer_Expression_Lambda
module MathJs = Reducer_MathJs
module Module = Reducer_Category_Module
module Result = Belt.Result
open ReducerInterface_InternalExpressionValue
open Reducer_ErrorValue

/*
  MathJs provides default implementations for builtins
  This is where all the expected builtins like + = * / sin cos log ln etc are handled
  DO NOT try to add external function mapping here!
*/

//TODO: pow to xor

exception TestRescriptException

let callInternal = (call: functionCall, environment, reducer: ExpressionT.reducerFn): result<
  'b,
  errorValue,
> => {
  let callMathJs = (call: functionCall): result<'b, errorValue> =>
    switch call {
    | ("javascriptraise", [msg]) => Js.Exn.raiseError(toString(msg)) // For Tests
    | ("rescriptraise", _) => raise(TestRescriptException) // For Tests
    | call => call->toStringFunctionCall->MathJs.Eval.eval
    }

  let constructRecord = arrayOfPairs => {
    Belt.Array.map(arrayOfPairs, pairValue =>
      switch pairValue {
      | IEvArray([IEvString(key), valueValue]) => (key, valueValue)
      | _ => ("wrong key type", pairValue->toStringWithType->IEvString)
      }
    )
    ->Belt.Map.String.fromArray
    ->IEvRecord
    ->Ok
  }

  let arrayAtIndex = (aValueArray: array<internalExpressionValue>, fIndex: float) =>
    switch Belt.Array.get(aValueArray, Belt.Int.fromFloat(fIndex)) {
    | Some(value) => value->Ok
    | None => REArrayIndexNotFound("Array index not found", Belt.Int.fromFloat(fIndex))->Error
    }

  let moduleAtIndex = (nameSpace: nameSpace, sIndex) =>
    switch Module.get(nameSpace, sIndex) {
    | Some(value) => value->Ok
    | None => RERecordPropertyNotFound("Module property not found", sIndex)->Error
    }

  let recordAtIndex = (dict: Belt.Map.String.t<internalExpressionValue>, sIndex) =>
    switch Belt.Map.String.get(dict, sIndex) {
    | Some(value) => value->Ok
    | None => RERecordPropertyNotFound("Record property not found", sIndex)->Error
    }

  let doAddArray = (originalA, b) => {
    let a = originalA->Js.Array2.copy
    let _ = Js.Array2.pushMany(a, b)
    a->IEvArray->Ok
  }
  let doAddString = (a, b) => {
    let answer = Js.String2.concat(a, b)
    answer->IEvString->Ok
  }

  let inspect = (value: internalExpressionValue) => {
    Js.log(value->toString)
    value->Ok
  }

  let inspectLabel = (value: internalExpressionValue, label: string) => {
    Js.log(`${label}: ${value->toString}`)
    value->Ok
  }

  let doSetBindings = (bindings: nameSpace, symbol: string, value: internalExpressionValue) => {
    Module.set(bindings, symbol, value)->IEvModule->Ok
  }

  let doSetTypeAliasBindings = (
    bindings: nameSpace,
    symbol: string,
    value: internalExpressionValue,
  ) => Module.setTypeAlias(bindings, symbol, value)->IEvModule->Ok

  let doSetTypeOfBindings = (bindings: nameSpace, symbol: string, value: internalExpressionValue) =>
    Module.setTypeOf(bindings, symbol, value)->IEvModule->Ok

  let doExportBindings = (bindings: nameSpace) => bindings->Module.toExpressionValue->Ok

  let doKeepArray = (aValueArray, aLambdaValue) => {
    let rMappedList = aValueArray->Belt.Array.reduceReverse(Ok(list{}), (rAcc, elem) =>
      rAcc->Result.flatMap(acc => {
        let rNewElem = Lambda.doLambdaCall(aLambdaValue, list{elem}, environment, reducer)
        rNewElem->Result.map(newElem =>
          switch newElem {
          | IEvBool(true) => list{elem, ...acc}
          | _ => acc
          }
        )
      })
    )
    rMappedList->Result.map(mappedList => mappedList->Belt.List.toArray->IEvArray)
  }

  let doMapArray = (aValueArray, aLambdaValue) => {
    let rMappedList = aValueArray->Belt.Array.reduceReverse(Ok(list{}), (rAcc, elem) =>
      rAcc->Result.flatMap(acc => {
        let rNewElem = Lambda.doLambdaCall(aLambdaValue, list{elem}, environment, reducer)
        rNewElem->Result.map(newElem => list{newElem, ...acc})
      })
    )
    rMappedList->Result.map(mappedList => mappedList->Belt.List.toArray->IEvArray)
  }

  module SampleMap = {
    type t = SampleSetDist.t
    let doLambdaCall = (aLambdaValue, list) =>
      switch Lambda.doLambdaCall(aLambdaValue, list, environment, reducer) {
      | Ok(IEvNumber(f)) => Ok(f)
      | _ => Error(Operation.SampleMapNeedsNtoNFunction)
      }

    let toType = r =>
      switch r {
      | Ok(r) => Ok(IEvDistribution(SampleSet(r)))
      | Error(r) => Error(REDistributionError(SampleSetError(r)))
      }

    let map1 = (sampleSetDist: t, aLambdaValue) => {
      let fn = r => doLambdaCall(aLambdaValue, list{IEvNumber(r)})
      toType(SampleSetDist.samplesMap(~fn, sampleSetDist))
    }

    let map2 = (t1: t, t2: t, aLambdaValue) => {
      let fn = (a, b) => doLambdaCall(aLambdaValue, list{IEvNumber(a), IEvNumber(b)})
      SampleSetDist.map2(~fn, ~t1, ~t2)->toType
    }

    let map3 = (t1: t, t2: t, t3: t, aLambdaValue) => {
      let fn = (a, b, c) =>
        doLambdaCall(aLambdaValue, list{IEvNumber(a), IEvNumber(b), IEvNumber(c)})
      SampleSetDist.map3(~fn, ~t1, ~t2, ~t3)->toType
    }
  }

  let doReduceArray = (aValueArray, initialValue, aLambdaValue) => {
    aValueArray->Belt.Array.reduce(Ok(initialValue), (rAcc, elem) =>
      rAcc->Result.flatMap(acc =>
        Lambda.doLambdaCall(aLambdaValue, list{acc, elem}, environment, reducer)
      )
    )
  }

  let doReduceReverseArray = (aValueArray, initialValue, aLambdaValue) => {
    aValueArray->Belt.Array.reduceReverse(Ok(initialValue), (rAcc, elem) =>
      rAcc->Result.flatMap(acc =>
        Lambda.doLambdaCall(aLambdaValue, list{acc, elem}, environment, reducer)
      )
    )
  }

  let typeModifier_memberOf = (aType, anArray) => {
    let newRecord = Belt.Map.String.fromArray([
      ("typeTag", IEvString("typeIdentifier")),
      ("typeIdentifier", aType),
    ])
    newRecord->Belt.Map.String.set("memberOf", anArray)->IEvRecord->Ok
  }
  let typeModifier_memberOf_update = (aRecord, anArray) => {
    aRecord->Belt.Map.String.set("memberOf", anArray)->IEvRecord->Ok
  }

  let typeModifier_min = (aType, value) => {
    let newRecord = Belt.Map.String.fromArray([
      ("typeTag", IEvString("typeIdentifier")),
      ("typeIdentifier", aType),
    ])
    newRecord->Belt.Map.String.set("min", value)->IEvRecord->Ok
  }
  let typeModifier_min_update = (aRecord, value) => {
    aRecord->Belt.Map.String.set("min", value)->IEvRecord->Ok
  }

  let typeModifier_max = (aType, value) => {
    let newRecord = Belt.Map.String.fromArray([
      ("typeTag", IEvString("typeIdentifier")),
      ("typeIdentifier", aType),
    ])
    newRecord->Belt.Map.String.set("max", value)->IEvRecord->Ok
  }
  let typeModifier_max_update = (aRecord, value) =>
    aRecord->Belt.Map.String.set("max", value)->IEvRecord->Ok

  let typeModifier_opaque_update = aRecord =>
    aRecord->Belt.Map.String.set("opaque", IEvBool(true))->IEvRecord->Ok

  let typeOr = evArray => {
    let newRecord = Belt.Map.String.fromArray([
      ("typeTag", IEvString("typeOr")),
      ("typeOr", evArray),
    ])
    newRecord->IEvRecord->Ok
  }
  let typeFunction = anArray => {
    let output = Belt.Array.getUnsafe(anArray, Js.Array2.length(anArray) - 1)
    let inputs = Js.Array2.slice(anArray, ~start=0, ~end_=-1)
    let newRecord = Belt.Map.String.fromArray([
      ("typeTag", IEvString("typeFunction")),
      ("inputs", IEvArray(inputs)),
      ("output", output),
    ])
    newRecord->IEvRecord->Ok
  }

  switch call {
  | ("$_atIndex_$", [IEvArray(aValueArray), IEvNumber(fIndex)]) => arrayAtIndex(aValueArray, fIndex)
  | ("$_atIndex_$", [IEvModule(dict), IEvString(sIndex)]) => moduleAtIndex(dict, sIndex)
  | ("$_atIndex_$", [IEvRecord(dict), IEvString(sIndex)]) => recordAtIndex(dict, sIndex)
  | ("$_constructArray_$", [IEvArray(aValueArray)]) => IEvArray(aValueArray)->Ok
  | ("$_constructRecord_$", [IEvArray(arrayOfPairs)]) => constructRecord(arrayOfPairs)
  | ("$_exportBindings_$", [IEvModule(nameSpace)]) => doExportBindings(nameSpace)
  | ("$_setBindings_$", [IEvModule(nameSpace), IEvSymbol(symbol), value]) =>
    doSetBindings(nameSpace, symbol, value)
  | ("$_setTypeAliasBindings_$", [IEvModule(nameSpace), IEvTypeIdentifier(symbol), value]) =>
    doSetTypeAliasBindings(nameSpace, symbol, value)
  | ("$_setTypeOfBindings_$", [IEvModule(nameSpace), IEvSymbol(symbol), value]) =>
    doSetTypeOfBindings(nameSpace, symbol, value)
  | ("$_typeModifier_memberOf_$", [IEvTypeIdentifier(typeIdentifier), IEvArray(arr)]) =>
    typeModifier_memberOf(IEvTypeIdentifier(typeIdentifier), IEvArray(arr))
  | ("$_typeModifier_memberOf_$", [IEvRecord(typeRecord), IEvArray(arr)]) =>
    typeModifier_memberOf_update(typeRecord, IEvArray(arr))
  | ("$_typeModifier_min_$", [IEvTypeIdentifier(typeIdentifier), value]) =>
    typeModifier_min(IEvTypeIdentifier(typeIdentifier), value)
  | ("$_typeModifier_min_$", [IEvRecord(typeRecord), value]) =>
    typeModifier_min_update(typeRecord, value)
  | ("$_typeModifier_max_$", [IEvTypeIdentifier(typeIdentifier), value]) =>
    typeModifier_max(IEvTypeIdentifier(typeIdentifier), value)
  | ("$_typeModifier_max_$", [IEvRecord(typeRecord), value]) =>
    typeModifier_max_update(typeRecord, value)
  | ("$_typeModifier_opaque_$", [IEvRecord(typeRecord)]) => typeModifier_opaque_update(typeRecord)
  | ("$_typeOr_$", [IEvArray(arr)]) => typeOr(IEvArray(arr))
  | ("$_typeFunction_$", [IEvArray(arr)]) => typeFunction(arr)
  | ("concat", [IEvArray(aValueArray), IEvArray(bValueArray)]) =>
    doAddArray(aValueArray, bValueArray)
  | ("concat", [IEvString(aValueString), IEvString(bValueString)]) =>
    doAddString(aValueString, bValueString)
  | ("inspect", [value, IEvString(label)]) => inspectLabel(value, label)
  | ("inspect", [value]) => inspect(value)
  | ("filter", [IEvArray(aValueArray), IEvLambda(aLambdaValue)]) =>
    doKeepArray(aValueArray, aLambdaValue)
  | ("map", [IEvArray(aValueArray), IEvLambda(aLambdaValue)]) =>
    doMapArray(aValueArray, aLambdaValue)
  | ("mapSamples", [IEvDistribution(SampleSet(dist)), IEvLambda(aLambdaValue)]) =>
    SampleMap.map1(dist, aLambdaValue)
  | (
      "mapSamples2",
      [
        IEvDistribution(SampleSet(dist1)),
        IEvDistribution(SampleSet(dist2)),
        IEvLambda(aLambdaValue),
      ],
    ) =>
    SampleMap.map2(dist1, dist2, aLambdaValue)
  | (
      "mapSamples3",
      [
        IEvDistribution(SampleSet(dist1)),
        IEvDistribution(SampleSet(dist2)),
        IEvDistribution(SampleSet(dist3)),
        IEvLambda(aLambdaValue),
      ],
    ) =>
    SampleMap.map3(dist1, dist2, dist3, aLambdaValue)
  | ("reduce", [IEvArray(aValueArray), initialValue, IEvLambda(aLambdaValue)]) =>
    doReduceArray(aValueArray, initialValue, aLambdaValue)
  | ("reduceReverse", [IEvArray(aValueArray), initialValue, IEvLambda(aLambdaValue)]) =>
    doReduceReverseArray(aValueArray, initialValue, aLambdaValue)
  | ("reverse", [IEvArray(aValueArray)]) => aValueArray->Belt.Array.reverse->IEvArray->Ok
  | (_, [IEvBool(_)])
  | (_, [IEvNumber(_)])
  | (_, [IEvString(_)])
  | (_, [IEvBool(_), IEvBool(_)])
  | (_, [IEvNumber(_), IEvNumber(_)])
  | (_, [IEvString(_), IEvString(_)]) =>
    callMathJs(call)
  | call =>
    Error(REFunctionNotFound(call->functionCallToCallSignature->functionCallSignatureToString)) // Report full type signature as error
  }
}

/*
  Reducer uses Result monad while reducing expressions
*/
let dispatch = (call: functionCall, environment, reducer: ExpressionT.reducerFn): result<
  internalExpressionValue,
  errorValue,
> =>
  try {
    let callInternalWithReducer = (call, environment) => callInternal(call, environment, reducer)
    let (fn, args) = call
    // There is a bug that prevents string match in patterns
    // So we have to recreate a copy of the string
    ExternalLibrary.dispatch((Js.String.make(fn), args), environment, callInternalWithReducer)
  } catch {
  | Js.Exn.Error(obj) => REJavaScriptExn(Js.Exn.message(obj), Js.Exn.name(obj))->Error
  | _ => RETodo("unhandled rescript exception")->Error
  }
