/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  redirects: async () => [
    {
      source: "/dashboard/wallet",
      destination: "/wallet",
      permanent: true,
    },
    {
      source: "/dashboard/deposit",
      destination: "/deposit",
      permanent: true,
    },
    {
      source: "/dashboard/withdraw",
      destination: "/withdraw",
      permanent: true,
    },
    {
      source: "/dashboard/investments",
      destination: "/investments",
      permanent: true,
    },
    {
      source: "/dashboard/earnings",
      destination: "/earnings",
      permanent: true,
    },
    {
      source: "/dashboard/team",
      destination: "/team",
      permanent: true,
    },
    {
      source: "/dashboard/referral",
      destination: "/referral",
      permanent: true,
    },
    {
      source: "/dashboard/notifications",
      destination: "/notifications",
      permanent: true,
    },
    {
      source: "/dashboard/support",
      destination: "/support",
      permanent: true,
    },
    {
      source: "/dashboard/profile",
      destination: "/profile",
      permanent: true,
    },
    {
      source: "/dashboard/settings",
      destination: "/settings",
      permanent: true,
    },
    {
      source: "/dashboard/staking",
      destination: "/invest",
      permanent: true,
    },
    {
      source: "/dashboard/package",
      destination: "/invest",
      permanent: true,
    },
    {
      source: "/dashboard/invest",
      destination: "/invest",
      permanent: true,
    },
    {
      source: "/admin/mlm",
      destination: "/admin/team",
      permanent: true,
    },
  ],
};

export default nextConfig;
