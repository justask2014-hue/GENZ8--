// POST /api/generate
// Body: { prompt: string, duration: "5"|"10", aspect_ratio: "16:9"|"9:16"|"1:1", mode: "video"|"image" }
// Starts a Kling generation job via fal.ai and returns a request_id to poll.
//
// Requires an environment variable FAL_KEY set in your hosting dashboard
// (Vercel: Project Settings -> Environment Variables). Never put the key
// in frontend code.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    return res.status(500).json({ error: "Server is missing FAL_KEY. Add it in your hosting dashboard." });
  }

  const { prompt, duration = "5", aspect_ratio = "16:9", mode = "video" } = req.body || {};
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  // Kling 1.6 standard text-to-video model on fal.ai
  const modelPath =
    mode === "image"
      ? "fal-ai/flux/schnell" // fast, cheap image model for the "image" mode
      : "fal-ai/kling-video/v1.6/standard/text-to-video";

  const input =
    mode === "image"
      ? { prompt, image_size: aspect_ratio === "9:16" ? "portrait_16_9" : aspect_ratio === "1:1" ? "square" : "landscape_16_9" }
      : { prompt, duration, aspect_ratio };

  try {
    const submit = await fetch(`https://queue.fal.run/${modelPath}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = await submit.json();
    if (!submit.ok) {
      return res.status(submit.status).json({ error: data?.detail || "Generation request failed" });
    }

    // fal.ai returns a request_id we poll for status/result
    return res.status(200).json({
      request_id: data.request_id,
      status_url: data.status_url,
      response_url: data.response_url,
      mode,
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not reach the generation provider" });
  }
}
