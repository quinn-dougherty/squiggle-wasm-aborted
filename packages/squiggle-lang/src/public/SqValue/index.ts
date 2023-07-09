import { result } from "../../utility/result.js";
import { Value, vLambda, vNumber, vString } from "../../value/index.js";
import { SqError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqArray } from "./SqArray.js";
import { SqDistribution, wrapDistribution } from "./SqDistribution/index.js";
import { SqLambda } from "./SqLambda.js";
import { SqLambdaDeclaration } from "./SqLambdaDeclaration.js";
import { SqPlot, wrapPlot } from "./SqPlot.js";
import { SqRecord } from "./SqRecord.js";
import { SqScale, wrapScale } from "./SqScale.js";

export function wrapValue(value: Value, context?: SqValueContext) {
  switch (value.type) {
    case "Array":
      return new SqArrayValue(value, context);
    case "Bool":
      return new SqBoolValue(value, context);
    case "Date":
      return new SqDateValue(value, context);
    case "Declaration":
      return new SqDeclarationValue(value, context);
    case "Dist":
      return new SqDistributionValue(value, context);
    case "Lambda":
      return new SqLambdaValue(value, context);
    case "Number":
      return new SqNumberValue(value, context);
    case "Record":
      return new SqRecordValue(value, context);
    case "String":
      return new SqStringValue(value, context);
    case "Plot":
      return new SqPlotValue(value, context);
    case "Scale":
      return new SqScaleValue(value, context);
    case "TimeDuration":
      return new SqTimeDurationValue(value, context);
    case "Void":
      return new SqVoidValue(value, context);
    default:
      throw new Error(`Unknown value ${JSON.stringify(value)}`);
  }
}

export abstract class SqAbstractValue<Type extends string, JSType> {
  abstract tag: Type;

  constructor(
    public _value: Extract<Value, { type: Type }>,
    public context?: SqValueContext
  ) {}

  toString() {
    return this._value.toString();
  }

  abstract asJS(): JSType;
}

export class SqArrayValue extends SqAbstractValue<"Array", unknown[]> {
  tag = "Array" as const;

  get value() {
    return new SqArray(this._value.value, this.context);
  }

  asJS(): unknown[] {
    return this.value.getValues().map((value) => value.asJS());
  }
}

export class SqBoolValue extends SqAbstractValue<"Bool", boolean> {
  tag = "Bool" as const;

  get value(): boolean {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqDateValue extends SqAbstractValue<"Date", Date> {
  tag = "Date" as const;

  get value(): Date {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqDeclarationValue extends SqAbstractValue<
  "Declaration",
  SqLambdaDeclaration
> {
  tag = "Declaration" as const;

  get value() {
    return new SqLambdaDeclaration(this._value.value, this.context);
  }

  asJS() {
    return this.value;
  }
}

export class SqDistributionValue extends SqAbstractValue<
  "Dist",
  SqDistribution
> {
  tag = "Dist" as const;

  get value() {
    return wrapDistribution(this._value.value);
  }

  asJS() {
    return this.value; // should we return BaseDist instead?
  }
}

export class SqLambdaValue extends SqAbstractValue<"Lambda", SqLambda> {
  tag = "Lambda" as const;

  static create(value: SqLambda) {
    return new SqLambdaValue(vLambda(value._value));
  }

  get value() {
    return new SqLambda(this._value.value, this.context);
  }

  asJS() {
    return this.value; // SqLambda is nicer than internal Lambda, so we use that
  }
}

export class SqNumberValue extends SqAbstractValue<"Number", number> {
  tag = "Number" as const;

  static create(value: number) {
    return new SqNumberValue(vNumber(value));
  }

  get value(): number {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqRecordValue extends SqAbstractValue<
  "Record",
  Map<string, unknown>
> {
  tag = "Record" as const;

  get value() {
    return new SqRecord(this._value.value, this.context);
  }

  asJS(): Map<string, unknown> {
    return new Map(this.value.entries().map(([k, v]) => [k, v.asJS()])); // this is a native Map, not immutable Map
  }
}

export class SqStringValue extends SqAbstractValue<"String", string> {
  tag = "String" as const;

  static create(value: string) {
    return new SqStringValue(vString(value));
  }

  get value(): string {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqTimeDurationValue extends SqAbstractValue<
  "TimeDuration",
  number
> {
  tag = "TimeDuration" as const;

  get value() {
    return this._value.value;
  }

  asJS() {
    return this._value.value;
  }
}

export class SqPlotValue extends SqAbstractValue<"Plot", SqPlot> {
  tag = "Plot" as const;

  get value() {
    return wrapPlot(this._value.value, this.context);
  }

  asJS() {
    return this.value;
  }
}

export class SqScaleValue extends SqAbstractValue<"Scale", SqScale> {
  tag = "Scale" as const;

  get value() {
    return wrapScale(this._value.value);
  }

  asJS() {
    return this.value;
  }
}

export class SqVoidValue extends SqAbstractValue<"Void", null> {
  tag = "Void" as const;

  get value() {
    return null;
  }

  asJS() {
    return null;
  }
}

export type SqValue = ReturnType<typeof wrapValue>;

export function toStringResult(result: result<SqValue, SqError>) {
  return `${result.ok ? "Ok" : "Error"}(${result.value.toString()})`;
}