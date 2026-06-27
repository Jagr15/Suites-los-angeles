import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUserWithRole } from "../common/utils";

function getOperationalDate(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    throw new Error("No se pudo calcular la fecha operativa");
  }
  return `${year}-${month}-${day}`;
}

export const getActive = query({
  args: {
    date: v.optional(v.string()),
    profileId: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserWithRole(ctx);
    const date = args.date?.trim() || getOperationalDate();
    const resolvedProfileId = args.profileId ?? currentUser?.user.profileId ?? null;
    if (!resolvedProfileId) return null;

    const journey = await ctx.db
      .query("journeys")
      .withIndex("by_profile_date", (q) => q.eq("profileId", resolvedProfileId).eq("date", date))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!journey) return null;

    const profile = await ctx.db.get(journey.profileId);
    const user = profile?.userId ? await ctx.db.get(profile.userId) : null;
    const bodegaId = profile?.assignedBodegaId ?? user?.allowedWarehouseIds?.[0] ?? null;
    const route = await ctx.db
      .query("routes")
      .withIndex("by_assignedProfileId", (q) => q.eq("assignedProfileId", journey.profileId))
      .first();

    return {
      _id: journey._id,
      profileId: journey.profileId,
      routeId: route?._id ?? null,
      date: journey.date,
      status: journey.status,
      startKm: journey.startKm,
      startedAt: journey.startTime,
      bodegaId,
    };
  },
});
