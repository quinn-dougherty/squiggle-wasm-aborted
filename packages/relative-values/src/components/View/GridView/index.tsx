import { Item } from "@/types";
import { RVStorage } from "@/values/RVStorage";
import { FC, Fragment, useCallback, useMemo } from "react";
import { useInterfaceContext } from "../../Interface/InterfaceProvider";
import { DropdownButton } from "../../ui/DropdownButton";
import { Header } from "../Header";
import { useFilteredItems, useSortedItems } from "../hooks";
import { RelativeCell } from "../RelativeCell";
import { useViewContext } from "../ViewProvider";
import { AxisMenu } from "./AxisMenu";
import { GridModeControls } from "./GridModeControls";

export const GridView: FC<{
  rv: RVStorage;
}> = ({ rv }) => {
  const { axisConfig, gridMode } = useViewContext();
  const {
    catalog: { items },
  } = useInterfaceContext();

  const filteredRowItems = useFilteredItems({
    items: items,
    config: axisConfig.rows,
  });
  const filteredColumnItems = useFilteredItems({
    items: items,
    config: axisConfig.columns,
  });

  const rowItems = useSortedItems({
    items: filteredRowItems,
    config: axisConfig.rows,
    rv,
    otherDimensionItems: filteredColumnItems,
  });
  const columnItems = useSortedItems({
    items: filteredColumnItems,
    config: axisConfig.columns,
    rv,
    otherDimensionItems: filteredRowItems,
  });

  const idToPosition = useMemo(() => {
    const result: { [k: string]: number } = {};
    for (let i = 0; i < items.length; i++) {
      result[items[i].id] = i;
    }
    return result;
  }, [items]);

  const isHiddenPair = useCallback(
    (rowItem: Item, columnItem: Item) => {
      if (gridMode === "full") {
        return false;
      }
      return idToPosition[rowItem.id] <= idToPosition[columnItem.id];
    },
    [idToPosition, gridMode]
  );

  return (
    <div>
      <div className="flex gap-8 mb-4 items-center">
        <div className="flex gap-2">
          <DropdownButton text="Row Settings">
            {() => <AxisMenu axis="rows" />}
          </DropdownButton>
          <DropdownButton text="Column Settings">
            {() => <AxisMenu axis="columns" />}
          </DropdownButton>
        </div>
        <GridModeControls />
      </div>
      <div
        className="grid relative"
        style={{
          gridTemplateColumns: `repeat(${columnItems.length + 1}, 140px)`,
        }}
      >
        <div className="sticky bg-white top-0 left-0 z-20" />
        {columnItems.map((item) => (
          <Header key={item.id} item={item} />
        ))}
        {rowItems.map((rowItem) => (
          <Fragment key={rowItem.id}>
            <Header key={0} item={rowItem} />
            {columnItems.map((columnItem) =>
              isHiddenPair(rowItem, columnItem) ? (
                <div key={columnItem.id} className="bg-gray-200" />
              ) : (
                <RelativeCell
                  key={columnItem.id}
                  id1={rowItem.id}
                  id2={columnItem.id}
                  rv={rv}
                />
              )
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};