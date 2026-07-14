export default async (req, context) => {
  const SITE_URL = process.env.SITE_URL || "https://cryptoearnerx.online";
  const CRON_SECRET = process.env.CRON_SECRET;

  try {
    const res = await fetch(`${SITE_URL}/api/cron/daily-roi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CRON_SECRET}`,
      },
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config = {
  schedule: "0 0 * * *",
};
