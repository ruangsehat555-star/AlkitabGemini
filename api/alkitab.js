
export default async function handler(req, res) {
  const apiKey = process.env.ALKITAB_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Environment variable ALKITAB_API_KEY belum diatur di Vercel."
    });
  }

  const kitab = String((req.query && req.query.kitab) || "Yohanes").trim();
  const pasal = String((req.query && req.query.pasal) || "3").trim();
  const baseUrl = (process.env.ALKITAB_API_URL || "https://api.co.id/api/alkitab").replace(/\/+$/, "");
  const bookSlug = kitab.toLowerCase().replace(/\s+/g, "-");

  const candidates = [
    `${baseUrl}?kitab=${encodeURIComponent(kitab)}&pasal=${encodeURIComponent(pasal)}`,
    `${baseUrl}/${encodeURIComponent(bookSlug)}/${encodeURIComponent(pasal)}`,
    `${baseUrl}?book=${encodeURIComponent(kitab)}&chapter=${encodeURIComponent(pasal)}`
  ];

  let lastStatus = 502;
  let lastDetail = "";

  for (const targetUrl of candidates) {
    try {
      const upstream = await fetch(targetUrl, {
        headers: {
          "Accept": "application/json",
          "x-api-co-id": apiKey,
          "Authorization": `Bearer ${apiKey}`
        }
      });
      if (!upstream.ok) {
        lastStatus = upstream.status;
        lastDetail = await upstream.text();
        continue;
      }
      const data = await upstream.json();
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.status(200).json(data);
    } catch (err) {
      lastDetail = err && err.message ? err.message : "Network error";
    }
  }

  return res.status(lastStatus).json({
    error: `API Alkitab gagal merespons (HTTP ${lastStatus})${lastDetail ? ": " + lastDetail.slice(0, 140) : ""}`
  });
                                               }
