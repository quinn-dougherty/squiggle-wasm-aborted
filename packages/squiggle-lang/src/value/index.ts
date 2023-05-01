import { BaseDist } from "../dist/BaseDist.js";
import { Expression } from "../expression/index.js";
import { Namespace } from "../reducer/bindings.js";
import { ReducerContext } from "../reducer/Context.js";
import isInteger from "lodash/isInteger.js";
import {
  declarationToString,
  LambdaDeclaration,
} from "../reducer/declaration.js";
import {
  ErrorMessage,
  REArrayIndexNotFound,
  REOther,
  RERecordPropertyNotFound,
} from "../reducer/ErrorMessage.js";
import { Lambda } from "../reducer/lambda.js";
import * as DateTime from "../utility/DateTime.js";

// TODO - move these types to reducer/
export type ReducerFn = (
  expression: Expression,
  context: ReducerContext
) => [Value, ReducerContext];

export type ValueMap = Namespace;

// Mixin for values that allow field lookups; just for type safety.
type Indexable = {
  get(key: Value): Value;
};

/*
Value classes are shaped in a similar way and can work as discriminated unions thank to the `type` property.

`type` property is currently stored on instances; that creates some memory overhead, but it's hard to store it in prototype in a type-safe way.

Also, it's important that `type` is declared "as const"; otherwise unions won't work properly.

If you add a new value class, don't forget to add it to the "Value" union type below.

"vBlah" functions are just for the sake of brevity, so that we don't have to prefix any value creation with "new".
*/

class VArray implements Indexable {
  readonly type = "Array" as const;
  constructor(public value: Value[]) {}
  toString(): string {
    return "[" + this.value.map((v) => v.toString()).join(",") + "]";
  }

  get(key: Value) {
    if (key.type === "Number") {
      if (!isInteger(key.value)) {
        return ErrorMessage.throw(
          REArrayIndexNotFound("Array index must be an integer", key.value)
        );
      }
      const index = key.value | 0;
      if (index >= 0 && index < this.value.length) {
        return this.value[index];
      } else {
        return ErrorMessage.throw(
          REArrayIndexNotFound("Array index not found", index)
        );
      }
    }

    return ErrorMessage.throw(
      REOther("Can't access non-numerical key on an array")
    );
  }

  flatten() {
    return new VArray(
      this.value.reduce(
        (acc: Value[], v) =>
          acc.concat(v.type === "Array" ? v.value : ([v] as Value[])),
        []
      )
    );
  }
}
export const vArray = (v: Value[]) => new VArray(v);

class VBool {
  readonly type = "Bool" as const;
  constructor(public value: boolean) {}
  toString() {
    return String(this.value);
  }
}
export const vBool = (v: boolean) => new VBool(v);

class VDate {
  readonly type = "Date" as const;
  constructor(public value: Date) {}
  toString() {
    return DateTime.Date.toString(this.value);
  }
}
export const vDate = (v: Date) => new VDate(v);

class VDeclaration implements Indexable {
  readonly type = "Declaration" as const;
  constructor(public value: LambdaDeclaration) {}
  toString() {
    return declarationToString(this.value, (f) => vLambda(f).toString());
  }
  get(key: Value) {
    if (key.type === "String" && key.value === "fn") {
      return vLambda(this.value.fn);
    }

    return ErrorMessage.throw(REOther("Trying to access key on wrong value"));
  }
}
export const vLambdaDeclaration = (v: LambdaDeclaration) => new VDeclaration(v);

class VDist {
  readonly type = "Dist" as const;
  constructor(public value: BaseDist) {}
  toString() {
    return this.value.toString();
  }
}
export const vDist = (v: BaseDist) => new VDist(v);

class VLambda {
  type = "Lambda" as const;
  constructor(public value: Lambda) {}
  toString() {
    return this.value.toString();
  }
}
export const vLambda = (v: Lambda) => new VLambda(v);

class VNumber {
  readonly type = "Number" as const;
  constructor(public value: number) {}
  toString() {
    return String(this.value);
  }
}
export const vNumber = (v: number) => new VNumber(v);

class VString {
  readonly type = "String" as const;
  constructor(public value: string) {}
  toString() {
    return `'${this.value}'`;
  }
}
export const vString = (v: string) => new VString(v);

class VRecord implements Indexable {
  readonly type = "Record" as const;
  constructor(public value: ValueMap) {}
  toString(): string {
    return (
      "{" +
      [...this.value.entries()]
        .map(([k, v]) => `${k}: ${v.toString()}`)
        .join(",") +
      "}"
    );
  }

  get(key: Value) {
    if (key.type === "String") {
      return (
        this.value.get(key.value) ??
        ErrorMessage.throw(
          RERecordPropertyNotFound("Record property not found", key.value)
        )
      );
    } else {
      return ErrorMessage.throw(
        REOther("Can't access non-string key on a record")
      );
    }
  }
}
export const vRecord = (v: ValueMap) => new VRecord(v);

class VTimeDuration {
  readonly type = "TimeDuration" as const;
  constructor(public value: number) {}
  toString() {
    return DateTime.Duration.toString(this.value);
  }
}
export const vTimeDuration = (v: number) => new VTimeDuration(v);

class VVoid {
  readonly type = "Void" as const;
  toString() {
    return "()";
  }
}
export const vVoid = () => new VVoid();

export type LabeledDistribution = {
  name?: string;
  distribution: BaseDist;
};

export type Plot =
  | {
      type: "distributions";
      distributions: LabeledDistribution[];
      xScale: Scale;
      yScale: Scale;
      title?: string;
      showSummary: boolean;
    }
  | {
      type: "scatter";
      xDist: BaseDist;
      yDist: BaseDist;
      xScale: Scale;
      yScale: Scale;
    }
  | {
      type: "numericFn";
      fn: Lambda;
      xScale: Scale;
      yScale: Scale;
      points?: number;
    }
  | {
      type: "distFn";
      fn: Lambda;
      xScale: Scale;
      distXScale: Scale;
      points?: number;
    };

class VPlot implements Indexable {
  readonly type = "Plot" as const;
  constructor(public value: Plot) {}

  toString(): string {
    switch (this.value.type) {
      case "distributions":
        return `Plot containing ${this.value.distributions
          .map((x) => x.name)
          .join(", ")}`;
      case "numericFn":
        return `Plot for numeric function ${this.value.fn}`;
      case "distFn":
        return `Plot for dist function ${this.value.fn}`;
      case "scatter":
        return `Scatter plot for distributions ${this.value.xDist} and ${this.value.yDist}`;
    }
  }

  get(key: Value) {
    if (
      key.type === "String" &&
      key.value === "fn" &&
      (this.value.type === "numericFn" || this.value.type === "distFn")
    ) {
      return vLambda(this.value.fn);
    }

    return ErrorMessage.throw(REOther("Trying to access key on wrong value"));
  }
}

export const vPlot = (plot: Plot) => new VPlot(plot);

export type CommonScaleArgs = {
  min?: number;
  max?: number;
  tickFormat?: string;
};

export type Scale = CommonScaleArgs &
  (
    | {
        type: "linear";
      }
    | {
        type: "log";
      }
    | {
        type: "symlog";
      }
    | {
        type: "power";
        exponent: number;
      }
  );

class VScale {
  readonly type = "Scale" as const;
  constructor(public value: Scale) {}

  toString(): string {
    switch (this.value.type) {
      case "linear":
        return "Linear scale"; // TODO - mix in min/max if specified
      case "log":
        return "Logarithmic scale";
      case "symlog":
        return "Symlog scale";
      case "power":
        return `Power scale (${this.value.exponent})`;
    }
  }
}

export const vScale = (scale: Scale) => new VScale(scale);

export type Value =
  | VArray
  | VBool
  | VDate
  | VDeclaration
  | VDist
  | VLambda
  | VNumber
  | VString
  | VRecord
  | VTimeDuration
  | VPlot
  | VScale
  | VVoid;