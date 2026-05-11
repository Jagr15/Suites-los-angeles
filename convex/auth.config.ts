const convexSiteUrl = process.env.CONVEX_SITE_URL;

if (!convexSiteUrl) {
  throw new Error("Missing CONVEX_SITE_URL in environment variables");
}

const authConfig = {
  providers: [
    {
      domain: convexSiteUrl,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
