import { signOut } from "next-auth/react";
import { FC } from "react";

import {
  DropdownMenu,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  UserCircleIcon,
  DropdownMenuActionItem,
  SignOutIcon,
  ScaleIcon,
  GroupIcon,
} from "@quri/ui";

import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";
import { userRoute, newDefinitionRoute, newGroupRoute } from "@/routes";

type Props = {
  close: () => void;
  username: string;
  mode: "desktop" | "mobile";
};

// this component is shared between DesktopUserControls, which is a normal Dropdown, and MobileUserControls, which is a fake dropdown.
// In both cases, it should be wrapped in DropdownMenu.
export const UserControlsMenu: FC<Props> = ({ close, username, mode }) => {
  return (
    <>
      <DropdownMenuHeader>
        {mode === "desktop" ? "User Actions" : `@${username}`}
      </DropdownMenuHeader>
      <DropdownMenuSeparator />
      <DropdownMenuLinkItem
        href={userRoute({ username })}
        icon={UserCircleIcon}
        title="Profile"
        close={close}
      />
      <DropdownMenuActionItem
        onClick={() => {
          signOut();
          close();
        }}
        icon={SignOutIcon}
        title="Sign Out"
      />
      <DropdownMenuSeparator />
      <DropdownMenuHeader>Experimental</DropdownMenuHeader>
      <DropdownMenuSeparator />
      <DropdownMenuLinkItem
        href={newDefinitionRoute()}
        icon={ScaleIcon}
        title="New Relative Value Definition"
        close={close}
      />
      <DropdownMenuLinkItem
        href={newGroupRoute()}
        icon={GroupIcon}
        title="New Group"
        close={close}
      />
    </>
  );
};