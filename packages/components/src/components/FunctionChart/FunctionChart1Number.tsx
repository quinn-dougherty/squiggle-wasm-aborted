import * as d3 from "d3";

import * as React from "react";
import { FC, useCallback, useMemo } from "react";

import { SqLambda } from "@quri/squiggle-lang";

import {
  drawAxes,
  drawCursorLines,
  primaryColor,
} from "../../lib/draw/index.js";
import { useCanvas, useCanvasCursor } from "../../lib/hooks/index.js";
import { ErrorAlert } from "../Alert.js";
import { FunctionChartSettings } from "./index.js";
import { getFunctionImage } from "./utils.js";

type Props = {
  fn: SqLambda;
  settings: FunctionChartSettings;
  height: number;
};

export const FunctionChart1Number: FC<Props> = ({
  fn,
  settings,
  height: innerHeight,
}) => {
  const height = innerHeight + 30; // consider paddings, should match suggestedPadding below
  const { cursor, initCursor } = useCanvasCursor();

  const { functionImage, errors } = useMemo(
    () => getFunctionImage({ settings, fn, valueType: "Number" }),
    [settings, fn]
  );

  const draw = useCallback(
    ({
      context,
      width,
    }: {
      context: CanvasRenderingContext2D;
      width: number;
    }) => {
      context.clearRect(0, 0, width, height);

      const { xScale, yScale, frame, padding } = drawAxes({
        suggestedPadding: { left: 20, right: 10, top: 10, bottom: 20 },
        xDomain: d3.extent(functionImage, (d) => d.x) as [number, number],
        yDomain: d3.extent(functionImage, (d) => d.y) as [number, number],
        width,
        height,
        context,
      });

      // line
      frame.enter();
      context.beginPath();
      context.strokeStyle = primaryColor;
      context.lineWidth = 2;
      context.imageSmoothingEnabled = true;

      d3
        .line<{ x: number; y: number }>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .context(context)(functionImage);

      context.stroke();
      frame.exit();

      if (
        cursor &&
        cursor.x >= padding.left &&
        cursor.x - padding.left <= frame.width
      ) {
        drawCursorLines({
          frame,
          cursor,
          x: {
            scale: xScale,
            format: d3.format(",.4r"),
          },
          y: {
            scale: yScale,
            format: d3.format(",.4r"),
          },
        });
      }
    },
    [functionImage, height, cursor]
  );

  const { ref } = useCanvas({ height, init: initCursor, draw });

  return (
    <div className="flex flex-col items-stretch">
      <canvas ref={ref}>Chart for {fn.toString()}</canvas>
      <div className="space-y-1">
        {errors.map(({ x, value }) => (
          // TODO - group errors with identical value
          <ErrorAlert key={x} heading={value}>
            Error at point {x}
          </ErrorAlert>
        ))}
      </div>
    </div>
  );
};
