import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { hashPassword } from "./hashing";

export type PasswordAuthAccount = {
  _id: Id<"authAccounts">;
  userId: Id<"users">;
  provider: string;
  providerAccountId: string;
  secret?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
};

export type PasswordAuthAudit = {
  accountId: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  hasSecret: boolean;
  linkedUserExists: boolean;
  linkedToExpectedUser: boolean;
  isDuplicate: boolean;
};

export type PasswordAccountRepairResult = {
  status: "existing" | "created" | "rebuilt";
  accountId: string;
  deleted: number;
  created: number;
  patched: number;
};

export type DemoAuthAuditRow = {
  email: string;
  internalUser: {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
    roleId: string | null;
    isActive: boolean | null;
    profileId: string | null;
    allowedWarehouseIds: string[];
  } | null;
  authUser: {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
    roleId: string | null;
    isActive: boolean | null;
    profileId: string | null;
    allowedWarehouseIds: string[];
  } | null;
  profile: {
    id: string;
    userId: string | null;
    fullName: string | null;
    status: string | null;
    group: string | null;
    isEmployee: boolean | null;
  } | null;
  passwordAccounts: PasswordAuthAudit[];
  duplicateUserRows: number;
  duplicatePasswordAccounts: number;
  linkStatus: "valid" | "missing" | "invalid";
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function listPasswordAccountsByEmail(
  ctx: Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">,
  email: string
) {
  const normalizedEmail = normalizeEmail(email);
  return await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", "password").eq("providerAccountId", normalizedEmail)
    )
    .collect();
}

export async function ensurePasswordAccountForUser(
  ctx: Pick<MutationCtx, "db">,
  args: {
    userId: Id<"users">;
    email: string;
    password: string;
  }
): Promise<PasswordAccountRepairResult> {
  const email = normalizeEmail(args.email);
  const secret = await hashPassword(args.password);
  const existingAccounts = await listPasswordAccountsByEmail(ctx, email);
  const exactMatch = existingAccounts.find(
    (account) =>
      String(account.userId) === String(args.userId) &&
      account.provider === "password" &&
      account.providerAccountId === email &&
      account.secret === secret
  );

  if (exactMatch) {
    return {
      status: "existing",
      accountId: String(exactMatch._id),
      deleted: 0,
      created: 0,
      patched: 0,
    };
  }

  const needsRebuild =
    existingAccounts.length !== 1 ||
    existingAccounts.some((account) => String(account.userId) !== String(args.userId)) ||
    existingAccounts.some((account) => account.provider !== "password" || account.providerAccountId !== email) ||
    existingAccounts.some((account) => account.secret !== secret);

  if (!needsRebuild && existingAccounts[0]) {
    return {
      status: "existing",
      accountId: String(existingAccounts[0]._id),
      deleted: 0,
      created: 0,
      patched: 0,
    };
  }

  for (const account of existingAccounts) {
    await ctx.db.delete(account._id);
  }

  const accountId = await ctx.db.insert("authAccounts", {
    userId: args.userId,
    provider: "password",
    providerAccountId: email,
    secret,
  });

  return {
    status: existingAccounts.length > 0 ? "rebuilt" : "created",
    accountId: String(accountId),
    deleted: existingAccounts.length,
    created: 1,
    patched: 0,
  };
}

export async function auditPasswordAccountsForEmail(
  ctx: Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">,
  args: {
    email: string;
    expectedUserId?: Id<"users">;
  }
): Promise<{
  email: string;
  internalUser: DemoAuthAuditRow["internalUser"];
  authUser: DemoAuthAuditRow["authUser"];
  profile: DemoAuthAuditRow["profile"];
  passwordAccounts: PasswordAuthAudit[];
  duplicateUserRows: number;
  duplicatePasswordAccounts: number;
  linkStatus: DemoAuthAuditRow["linkStatus"];
}> {
  const email = normalizeEmail(args.email);
  const users = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();
  const internalUser = users[0] || null;
  const authUser =
    args.expectedUserId !== undefined
      ? (await ctx.db.get(args.expectedUserId)) || null
      : internalUser;
  const profile = internalUser?.profileId
    ? await ctx.db.get(internalUser.profileId)
    : internalUser
      ? await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", internalUser._id))
          .first()
      : null;
  const accounts = await listPasswordAccountsByEmail(ctx, email);
  const linkedUsers = await Promise.all(accounts.map((account) => ctx.db.get(account.userId)));
  const passwordAccounts = accounts.map((account, index) => ({
    accountId: String(account._id),
    userId: String(account.userId),
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    hasSecret: Boolean(account.secret),
    linkedUserExists: linkedUsers[index] !== null,
    linkedToExpectedUser:
      args.expectedUserId !== undefined
        ? String(account.userId) === String(args.expectedUserId)
        : internalUser !== null && String(account.userId) === String(internalUser._id),
    isDuplicate: accounts.length > 1 && index > 0,
  }));

  let linkStatus: DemoAuthAuditRow["linkStatus"] = "missing";
  if (accounts.length === 0) {
    linkStatus = "missing";
  } else if (
    internalUser &&
    accounts.some((account) => String(account.userId) === String(internalUser._id))
  ) {
    linkStatus = "valid";
  } else {
    linkStatus = "invalid";
  }

  return {
    email,
    internalUser: internalUser
      ? {
          id: String(internalUser._id),
          name: internalUser.name ?? null,
          email: internalUser.email ?? null,
          role: internalUser.role ?? null,
          roleId: internalUser.roleId ? String(internalUser.roleId) : null,
          isActive: internalUser.isActive ?? null,
          profileId: internalUser.profileId ? String(internalUser.profileId) : null,
          allowedWarehouseIds: (internalUser.allowedWarehouseIds || []).map((id) => String(id)),
        }
      : null,
    authUser: authUser
      ? {
          id: String(authUser._id),
          name: authUser.name ?? null,
          email: authUser.email ?? null,
          role: authUser.role ?? null,
          roleId: authUser.roleId ? String(authUser.roleId) : null,
          isActive: authUser.isActive ?? null,
          profileId: authUser.profileId ? String(authUser.profileId) : null,
          allowedWarehouseIds: (authUser.allowedWarehouseIds || []).map((id) => String(id)),
        }
      : null,
    profile: profile
      ? {
          id: String(profile._id),
          userId: profile.userId ? String(profile.userId) : null,
          fullName: profile.fullName ?? null,
          status: profile.status ?? null,
          group: profile.group ?? null,
          isEmployee: profile.isEmployee ?? null,
        }
      : null,
    passwordAccounts,
    duplicateUserRows: users.length > 1 ? users.length - 1 : 0,
    duplicatePasswordAccounts: accounts.length > 1 ? accounts.length - 1 : 0,
    linkStatus,
  };
}
