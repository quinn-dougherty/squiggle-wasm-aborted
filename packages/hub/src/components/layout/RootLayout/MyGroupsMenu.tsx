import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { MyGroupsMenu$key } from "@/__generated__/MyGroupsMenu.graphql";
import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";
import { DropdownMenuHeader, DropdownMenuSeparator, GroupIcon } from "@quri/ui";
import { groupRoute, newGroupRoute } from "@/routes";
import { FaPlus } from "react-icons/fa";

type Props = {
  groupsRef: MyGroupsMenu$key;
  close: () => void;
};

export const MyGroupsMenu: FC<Props> = ({ groupsRef, close }) => {
  const groups = useFragment(
    graphql`
      fragment MyGroupsMenu on Query {
        result: groups(input: { myOnly: true }) {
          edges {
            node {
              id
              slug
            }
          }
        }
      }
    `,
    groupsRef
  );
  return (
    <>
      <DropdownMenuHeader>My Groups</DropdownMenuHeader>
      <DropdownMenuSeparator />
      {groups.result.edges.map((edge) => (
        <DropdownMenuLinkItem
          key={edge.node.id}
          href={groupRoute({ slug: edge.node.slug })}
          icon={GroupIcon}
          title={edge.node.slug}
          close={close}
        />
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuLinkItem
        href={newGroupRoute()}
        icon={FaPlus}
        title="New Group"
        close={close}
      />
      {/* TODO: "...show all" link is hasNextPage is true */}
    </>
  );
};
