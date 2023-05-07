import { prisma } from "@/prisma";
import { builder } from "@/graphql/builder";
import { Model } from "../types/models";

builder.mutationField("createSquiggleSnippetModel", (t) =>
  t.fieldWithInput({
    type: builder.simpleObject("CreateSquiggleSnippetResult", {
      fields: (t) => ({
        model: t.field({
          type: Model,
          nullable: false,
        }),
      }),
    }),
    authScopes: {
      user: true,
    },
    errors: {},
    input: {
      code: t.input.string({ required: true }),
      slug: t.input.string({
        required: true,
        validate: {
          regex: /^\w[\w\-]*$/,
        },
      }),
    },
    resolve: async (_, args, { session }) => {
      const email = session?.user.email;
      if (!email) {
        // shouldn't happen because we checked user auth scope previously, but helps with type checks
        throw new Error("Email is missing");
      }

      const model = await prisma.model.create({
        data: {
          slug: args.input.slug,
          squiggleSnippet: {
            create: {
              code: args.input.code,
            },
          },
          modelType: "SquiggleSnippet",
          owner: {
            connect: { email },
          },
        },
      });

      return {
        model,
      };
    },
  })
);
