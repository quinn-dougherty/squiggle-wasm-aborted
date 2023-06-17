import { builder } from "@/graphql/builder";
import {
  relativeValuesClustersSchema,
  relativeValuesItemsSchema,
} from "@/relative-values/types";
import { RelativeValuesExport } from "./RelativeValuesExport";
import { prisma } from "@/prisma";

const RelativeValuesCluster = builder.simpleObject("RelativeValuesCluster", {
  fields: (t) => ({
    id: t.string(),
    color: t.string(),
    recommendedUnit: t.string({ nullable: true }),
  }),
});

const RelativeValuesItem = builder.simpleObject("RelativeValuesItem", {
  fields: (t) => ({
    id: t.string(),
    name: t.string(),
    description: t.string(),
    clusterId: t.string({ nullable: true }),
  }),
});

export const RelativeValuesDefinition = builder.prismaNode(
  "RelativeValuesDefinition",
  {
    id: { field: "id" },
    fields: (t) => ({
      slug: t.exposeString("slug"),
      owner: t.relation("owner"),
      createdAtTimestamp: t.float({
        resolve: (obj) => obj.createdAt.getTime(),
      }),
      modelExports: t.field({
        type: [RelativeValuesExport],
        resolve: async (definition) => {
          const models = await prisma.model.findMany({
            where: {
              currentRevision: {
                relativeValuesExports: {
                  some: {
                    definitionId: definition.id,
                  },
                },
              },
            },
          });

          return await prisma.relativeValuesExport.findMany({
            where: {
              modelRevisionId: {
                in: models
                  .map((model) => model.currentRevisionId)
                  .filter((id): id is NonNullable<typeof id> => id !== null),
              },
              definitionId: definition.id,
            },
          });
        },
      }),
      currentRevision: t.field({
        type: RelativeValuesDefinitionRevision,
        select: (_, __, nestedSelection) => ({
          revisions: nestedSelection({
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          }),
        }),
        async resolve(obj) {
          return obj.revisions[0];
        },
      }),
    }),
  }
);

export const RelativeValuesDefinitionRevision = builder.prismaNode(
  "RelativeValuesDefinitionRevision",
  {
    id: { field: "id" },
    fields: (t) => ({
      title: t.exposeString("title"),
      items: t.field({
        type: [RelativeValuesItem],
        resolve(obj) {
          return relativeValuesItemsSchema.parse(obj.items);
        },
      }),
      clusters: t.field({
        type: [RelativeValuesCluster],
        resolve(obj) {
          return relativeValuesClustersSchema.parse(obj.clusters);
        },
      }),
      recommendedUnit: t.exposeString("recommendedUnit", { nullable: true }),
    }),
  }
);

export const RelativeValuesDefinitionConnection = builder.connectionObject({
  type: RelativeValuesDefinition,
  name: "RelativeValuesDefinitionConnection",
});