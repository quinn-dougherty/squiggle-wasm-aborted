import { prisma } from "@/prisma";
import { builder } from "../builder";
import { MembershipRoleType } from "../types/Group";
import { GroupInvite } from "../types/GroupInvite";
import { validateSlug } from "../utils";
import { ZodError } from "zod";

builder.mutationField("inviteUserToGroup", (t) =>
  t.withAuth({ signedIn: true }).fieldWithInput({
    type: builder.simpleObject("InviteUserToGroupResult", {
      fields: (t) => ({
        invite: t.field({ type: GroupInvite }),
      }),
    }),
    errors: { types: [ZodError] },
    input: {
      group: t.input.string({ required: true, validate: validateSlug }),
      username: t.input.string({ required: true, validate: validateSlug }),
      role: t.input.field({
        type: MembershipRoleType,
        required: true,
      }),
    },
    resolve: async (_, { input }, { session }) => {
      const invite = await prisma.$transaction(async (tx) => {
        const owner = await tx.owner.findUniqueOrThrow({
          where: {
            slug: input.group,
          },
        });

        // We perform all checks one by one because that allows more precise error reporting.
        // (It would be possible to check everything in one big query with clever nested `connect` checks.)
        const isAdmin = await tx.group.count({
          where: {
            ownerId: owner.id,
            memberships: {
              some: {
                user: { email: session.user.email },
                role: "Admin",
              },
            },
          },
        });
        if (!isAdmin) {
          throw new Error(`You're not a member of ${input.group} group`);
        }

        const alreadyAMember = await tx.group.count({
          where: {
            ownerId: owner.id,
            memberships: {
              some: {
                user: { username: input.username },
              },
            },
          },
        });
        if (alreadyAMember) {
          throw new Error(
            `${input.username} is already a member of ${input.group}`
          );
        }

        const hasPendingInvite = await tx.group.count({
          where: {
            ownerId: owner.id,
            invites: {
              some: {
                user: { username: input.username },
                status: "Pending",
              },
            },
          },
        });
        if (hasPendingInvite) {
          throw new Error(
            `There's already a pending invite for ${input.username} to join ${input.group}`
          );
        }

        return tx.groupInvite.create({
          data: {
            user: {
              connect: { username: input.username },
            },
            group: {
              connect: { ownerId: owner.id },
            },
            role: input.role,
          },
        });
      });

      return { invite };
    },
  })
);
