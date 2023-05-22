"use client";

import { useFragment, useLazyLoadQuery } from "react-relay";

import { ModelPageQuery as ModelPageQueryType } from "@gen/ModelPageQuery.graphql";
import { ModelPageFragment, ModelPageQuery } from "./ModelPage";
import { ModelContent } from "./ModelContent";
import { ModelPage$key } from "@/__generated__/ModelPage.graphql";

export default function OuterModelPage({
  params,
}: {
  params: { username: string; slug: string };
}) {
  // should be de-duped by Next.js caches, so it's not a problem that we do this query twice
  const data = useLazyLoadQuery<ModelPageQueryType>(ModelPageQuery, {
    input: { ownerUsername: params.username, slug: params.slug },
  });

  const model = useFragment<ModelPage$key>(ModelPageFragment, data.model);

  return <ModelContent model={model} mode="view" />;
}