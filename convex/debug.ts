import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./common/utils";

function assertDebugToolsEnabled() {
  if (process.env.DEBUG_TOOLS_ENABLED !== "true") {
    throw new Error("Debug tools are disabled");
  }
}

export const listAuthData = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    assertDebugToolsEnabled();
    const accounts = await ctx.db.query("authAccounts").collect();
    const sessions = await ctx.db.query("authSessions").collect();
    const users = await ctx.db.query("users").collect();
    return { accounts, sessions, users };
  },
});

export const cleanupOrphans = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    assertDebugToolsEnabled();
    const accounts = await ctx.db.query("authAccounts").collect();
    const users = await ctx.db.query("users").collect();
    const userIds = new Set(users.map(u => u._id));
    
    let deletedCount = 0;
    for (const account of accounts) {
      if (!userIds.has(account.userId)) {
        await ctx.db.delete(account._id);
        deletedCount++;
      }
    }
    
    const sessions = await ctx.db.query("authSessions").collect();
    for (const session of sessions) {
      if (!userIds.has(session.userId)) {
        await ctx.db.delete(session._id);
        deletedCount++;
      }
    }
    
    return { deletedCount };
  },
});
