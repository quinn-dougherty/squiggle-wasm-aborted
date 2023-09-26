import React, { FC, ReactNode } from "react";

import { SqValue, SqCalculator, SqError, result } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { SqValueWithContext, valueHasContext } from "../../lib/utility.js";

import ReactMarkdown from "react-markdown";

import { StyledInput } from "@quri/ui";
import { CalculatorState } from "./calculatorReducer.js";

type UIProps = {
  calculator: SqCalculator;
  settings: PlaygroundSettings;
  renderValue: (
    value: SqValueWithContext,
    settings: PlaygroundSettings
  ) => ReactNode;
  calculatorState: CalculatorState;
  onChange: (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const showSqValue = (
  renderValue: (
    value: SqValueWithContext,
    settings: PlaygroundSettings
  ) => ReactNode,
  item: result<SqValue, SqError>,
  settings: PlaygroundSettings
) => {
  if (item.ok) {
    const value = item.value;
    if (valueHasContext(value)) {
      return renderValue(value, settings);
    } else {
      return value.toString();
    }
  } else {
    return (
      <div className="text-sm text-red-800 text-opacity-70">
        {item.value.toString()}
      </div>
    );
  }
};

export const CalculatorUI: FC<UIProps> = ({
  renderValue,
  settings,
  calculator,
  calculatorState,
  onChange,
}) => {
  const fieldShowSettings: PlaygroundSettings = {
    ...settings,
    distributionChartSettings: {
      ...settings.distributionChartSettings,
      showSummary: false,
    },
    chartHeight: 30,
  };

  const resultSettings: PlaygroundSettings = {
    ...settings,
    chartHeight: 200,
  };

  return (
    <div className="border border-slate-200 rounded-sm max-w-4xl mx-auto">
      {calculator.description && (
        <div className="py-3 px-5 border-b border-slate-200 bg-slate-100">
          <ReactMarkdown className={"prose text-sm text-slate-800 max-w-4xl"}>
            {calculator.description}
          </ReactMarkdown>
        </div>
      )}

      <div className="py-3 px-5 border-b border-slate-200 bg-gray-50 space-y-3">
        {calculator.fields.map((row) => {
          const { name, description } = row;
          const field = calculatorState.fields[name];
          if (field) {
            const { value, code } = field;
            const result = value;
            const resultHasInterestingError =
              result && !result.ok && code !== "";
            return (
              <div key={name} className="flex flex-col mb-2">
                <div className="text-sm font-medium text-gray-800">{name}</div>
                {description && (
                  <div className="text-sm  text-gray-400">{description}</div>
                )}
                <div className="flex-grow mt-1 max-w-xs">
                  <StyledInput
                    value={code || ""}
                    onChange={onChange(name)}
                    placeholder={`Enter code for ${name}`}
                    size="small"
                  />
                </div>
                <div>
                  {result &&
                    resultHasInterestingError &&
                    showSqValue(renderValue, result, fieldShowSettings)}
                  {!result && (
                    <div className="text-sm text-gray-500">No result</div>
                  )}
                </div>
              </div>
            );
          }
        })}
      </div>

      {calculatorState.fn.value && (
        <div className="py-3 px-5">
          <div className="text-sm font-semibold text-gray-700 mb-2">Result</div>
          {showSqValue(renderValue, calculatorState.fn.value, resultSettings)}
        </div>
      )}
    </div>
  );
};