import { useInterfaceContext } from "@/components/Interface/InterfaceProvider";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";

type ModelContextShape = {
  selectedId?: string;
};

const ModelContext = createContext<ModelContextShape>({});

export const useSelectedModel = () => {
  const { selectedId } = useContext(ModelContext);
  const { models } = useInterfaceContext();

  const selectedModel = useMemo(() => {
    if (selectedId === undefined) {
      return;
    }
    return models.get(selectedId);
  }, [models, selectedId]);

  return { selectedId, selectedModel };
};

export const ModelProvider: FC<
  PropsWithChildren<{ value: ModelContextShape }>
> = ({ value, children }) => {
  return (
    <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
  );
};