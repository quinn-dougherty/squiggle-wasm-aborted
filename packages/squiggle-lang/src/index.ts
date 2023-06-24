import { Env } from "./dist/env.js";
import { SqProject } from "./public/SqProject/index.js";
import {
  SqValue,
  SqStringValue,
  SqNumberValue,
  SqLambdaValue,
} from "./public/SqValue.js"; // TODO - reexport other values too

export { SqValuePath } from "./public/SqValuePath.js";
export { result, fmap as resultMap } from "./utility/result.js";
export {
  SqAbstractDistribution,
  SqSampleSetDistribution,
  SqPointSetDistribution,
  SqSymbolicDistribution,
  SqDistribution,
  SqDistributionTag,
} from "./public/SqDistribution.js";
export { SqDistributionError } from "./public/SqDistributionError.js";
export { SqRecord } from "./public/SqRecord.js";
export { SqLambda } from "./public/SqLambda.js";
export { SqError, SqFrame } from "./public/SqError.js";
export { SqShape } from "./public/SqPointSet.js";
export {
  SqPlot,
  SqDistributionsPlot,
  SqNumericFnPlot,
  SqDistFnPlot,
  SqScatterPlot,
  SqRelativeValuesPlot,
} from "./public/SqPlot.js";
export {
  SqScale,
  SqLinearScale,
  SqLogScale,
  SqSymlogScale,
  SqPowerScale,
} from "./public/SqScale.js";
export { SqParseError, parse } from "./public/parse.js";

export { defaultEnv as defaultEnvironment } from "./dist/env.js";
export { SqProject, SqValue, SqStringValue, SqNumberValue, SqLambdaValue };
export { Env };
export { LocationRange as SqLocation } from "peggy";

export { AST, ASTNode } from "./ast/parse.js";
export { ASTCommentNode } from "./ast/peggyHelpers.js";

export async function run(
  code: string,
  options?: {
    environment?: Env;
  }
) {
  const project = SqProject.create();
  project.setSource("main", code);
  if (options?.environment) {
    project.setEnvironment(options.environment);
  }
  await project.run("main");
  const result = project.getResult("main");
  const bindings = project.getBindings("main");
  return { result, bindings };
}

// can be used for syntax highlighting in JS/TS files if you have Squiggle VS Code extension installed.
export function sq(strings: TemplateStringsArray, ...rest: unknown[]) {
  if (rest.length) {
    throw new Error("Extrapolation in sq`` template literals is forbidden");
  }
  return strings.join("");
}
