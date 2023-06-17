import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import { EntityInfo } from "@/components/EntityInfo";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { DotsDropdownButton } from "@/components/ui/DotsDropdownButton";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { relativeValuesEditRoute, relativeValuesRoute } from "@/routes";
import { DropdownMenu } from "@quri/ui";
import { DeleteDefinitionAction } from "./DeleteRelativeValuesDefinitionAction";
import { useSession } from "next-auth/react";

export const RelativeValuesDefinitionPageFragment = graphql`
  fragment RelativeValuesDefinitionPage on RelativeValuesDefinition {
    id
    slug
    owner {
      username
    }
    currentRevision {
      ...RelativeValuesDefinitionRevision
    }
    modelExports {
      id
      variableName
      modelRevision {
        model {
          owner {
            username
          }
          slug
        }
      }
    }
  }
`;

export const RelativeValuesDefinitionPageQuery = graphql`
  query RelativeValuesDefinitionPageQuery(
    $input: QueryRelativeValuesDefinitionInput!
  ) {
    relativeValuesDefinition(input: $input) {
      ...RelativeValuesDefinitionPage
    }
  }
`;

type Props = PropsWithChildren<{
  username: string;
  slug: string;
}>;

export const RelativeValuesDefinitionPage: FC<Props> = ({
  username,
  slug,
  children,
}) => {
  const { data: session } = useSession();

  return (
    <WithTopMenu addMarginToMainSection={false}>
      <div className="flex items-center gap-4 max-w-6xl mx-auto">
        <EntityInfo slug={slug} username={username} />
        {session?.user.username === username ? (
          <>
            <StyledTabLink.List>
              <StyledTabLink
                name="View"
                href={relativeValuesRoute({ username, slug })}
              />
              <StyledTabLink
                name="Edit"
                href={relativeValuesEditRoute({ username, slug })}
              />
            </StyledTabLink.List>
            <DotsDropdownButton>
              {({ close }) => (
                <DropdownMenu>
                  <DeleteDefinitionAction
                    username={username}
                    slug={slug}
                    close={close}
                  />
                </DropdownMenu>
              )}
            </DotsDropdownButton>
          </>
        ) : null}
      </div>
      <div>{children}</div>
    </WithTopMenu>
  );
};