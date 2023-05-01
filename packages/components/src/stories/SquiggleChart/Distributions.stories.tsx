import type { Meta, StoryObj } from "@storybook/react";

import { SquiggleChart } from "../../components/SquiggleChart.js";

/**
 * A distribution means that the result forms a probability distribution. This
 * could be continuous, discrete or mixed.
 */
const meta = {
  component: SquiggleChart,
} satisfies Meta<typeof SquiggleChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ContinuousSymbolic: Story = {
  name: "Continuous Symbolic",
  args: {
    code: "normal(5,2)",
  },
};

export const ContinuousPointset: Story = {
  name: "Continuous Pointset",
  args: {
    code: "PointSet.fromDist(normal(5,2))",
  },
};

export const ContinuousSampleSet: Story = {
  name: "Continuous SampleSet",
  args: {
    code: "SampleSet.fromDist(normal(5,2))",
  },
};

export const Discrete: Story = {
  args: {
    code: "mx(0, 1, 3, 5, 8, 10, [0.1, 0.8, 0.5, 0.3, 0.2, 0.1])",
  },
};

export const Scales: Story = {
  name: "Continuous with scales",
  args: {
    code: `Plot.dist({
  dist: -1 to 5,
  xScale: Scale.symlog(),
  yScale: Scale.power({ exponent: 0.1 }),
})`,
  },
};

export const CustomTickFormat: Story = {
  name: "Custom tick format",
  args: {
    code: `Plot.dist({
  dist: beta(3, 5),
  xScale: Scale.linear({ tickFormat: ".0%" }),
})`,
  },
};

/**
 * This feature is broken for now.
 */
export const DateDistribution: Story = {
  name: "Date Distribution",
  // otherwise SquiggleChart defaults to ".9~s"
  args: {
    code: "mx(1661819770311, 1661829770311, 1661839770311)",
    distributionChartSettings: {
      xAxisType: "dateTime",
      tickFormat: "",
    },
  },
};

export const Mixed: Story = {
  name: "Mixed",
  args: {
    code: "mx(0, 1, 3, 5, 8, normal(8, 1), [0.1, 0.3, 0.4, 0.35, 0.2, 0.8])",
  },
};

export const MultiplePlots: Story = {
  name: "Multiple plots",
  args: {
    code: `
Plot.dists({
dists: [
{
 name: "one",
 value: mx(0.5, normal(0,1))
},
{
 name: "two",
 value: mx(2, normal(5, 2)),
}
]
})
`,
  },
};