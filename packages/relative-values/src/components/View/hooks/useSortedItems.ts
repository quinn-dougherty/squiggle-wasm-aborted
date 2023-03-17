import { Item } from "@/types";
import _ from "lodash";
import { useMemo } from "react";
import { AxisConfig } from "../ViewProvider";
import { RelativeValue, RV } from "./useRelativeValues";

const averageMetric = ({
  item,
  comparedTo,
  getMetric,
  rv,
}: {
  item: Item;
  comparedTo: Item[];
  getMetric: (item: RelativeValue) => number;
  rv: RV;
}) => {
  return (
    comparedTo.reduce((total, item2) => {
      const value = rv.compare(item.id, item2.id);
      if (!value.ok) {
        return total; // TODO: +Inf?
      }
      return total + getMetric(value.value);
    }, 0) / comparedTo.length
  );
};

type AverageProps = {
  item: Item;
  comparedTo: Item[];
  rv: RV;
};

export function averageMedian({ item, comparedTo, rv }: AverageProps) {
  return averageMetric({
    item,
    getMetric: (item) => item.median,
    comparedTo,
    rv,
  });
}

export function averageDb({ item, comparedTo, rv }: AverageProps) {
  return averageMetric({
    item,
    getMetric: (item) => item.db,
    comparedTo,
    rv,
  });
}

export const useSortedItems = ({
  items,
  config,
  rv,
  otherDimensionItems: otherDimensionChoices,
}: {
  items: Item[];
  config: AxisConfig;
  rv: RV;
  otherDimensionItems: Item[]; // used for calculating average median and average uncertainty
}) => {
  return useMemo(() => {
    const sorted = (() => {
      switch (config.sort.mode) {
        case "median": {
          return _.sortBy(items, (item) =>
            averageMedian({ item, rv, comparedTo: otherDimensionChoices })
          );
        }
        case "uncertainty": {
          return _.sortBy(items, (item) =>
            averageDb({ item, rv, comparedTo: otherDimensionChoices })
          );
        }
        default:
          return items;
      }
    })();

    return config.sort.desc ? sorted.reverse() : sorted;
  }, [items, config, rv, otherDimensionChoices]);
};
