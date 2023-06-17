import React from "react";
import { MenuItem } from "../MenuItem.js";

import { PauseIcon, BoltIcon } from "@quri/ui";

import { RunnerState } from "./useRunnerState.js";

export const AutorunnerMenuItem: React.FC<RunnerState> = ({
  setAutorunMode,
  autorunMode,
}) => (
  <div data-testid="autorun-controls" aria-checked={autorunMode}>
    <MenuItem
      tooltipText={"Triggers runs on code changes"}
      icon={autorunMode ? BoltIcon : PauseIcon}
      onClick={() => setAutorunMode(!autorunMode)}
      className={!autorunMode ? "opacity-60" : ""}
    >
      Autorun
    </MenuItem>
  </div>
);