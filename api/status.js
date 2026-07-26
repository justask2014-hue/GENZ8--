// GET /api/status?status_url=...&response_url=...
// Polls fal.ai for job status; when complete, fetches and returns the result.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET" });
  }

  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    return res.status(500).json({ error: "Server is missing FAL_KEY." });
  }

  const { status_url, response_url } = req.query;
  if (!status_url || !response_url) {
    return res.status(400).json({ error: "Missing status_url or response_url" });
  }

  try {
    const statusRes = await fetch(status_url, {
      headers: { Authorization: `Key ${FAL_KEY}` },
    });
    const statusData = await statusRes.json();

    if (statusData.status !== "COMPLETED") {
      return res.status(200).json({ status: statusData.status || "IN_PROGRESS" });
    }

    const resultRes = await fetch(response_url, {
      headers: { Authorization: `Key ${FAL_KEY}` },
    });
    const resultData = await resultRes.json();

    const url = resultData?.video?.url || resultData?.images?.[0]?.url || null;

    return res.status(200).json({ status: "COMPLETED", url, raw: resultData });
  } catch (err) {
    return res.status(500).json({ error: "Could not check status" });
  }
}
