const ALLOWED_HOST = /(^|\.)((maps\.app\.goo\.gl)|(goo\.gl)|(google\.com)|(google\.co\.[a-z.]+))$/i;

export async function POST(request: Request) {
  let supplied: unknown;
  try { supplied = (await request.json()).url; } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof supplied !== "string" || supplied.length > 2048) return Response.json({ error: "Invalid Maps link." }, { status: 400 });
  let url: URL;
  try { url = new URL(supplied); } catch { return Response.json({ error: "Invalid Maps link." }, { status: 400 }); }
  if (url.protocol !== "https:" || !ALLOWED_HOST.test(url.hostname)) return Response.json({ error: "Only Google Maps links are supported." }, { status: 400 });
  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "BazarWeb/1.0" } });
    const finalUrl = new URL(response.url);
    if (!ALLOWED_HOST.test(finalUrl.hostname)) return Response.json({ error: "Could not resolve this Maps link." }, { status: 422 });
    const text = `${finalUrl.href} ${await response.text().catch(() => "")}`;
    const match = text.match(/(?:@|[?&](?:q|query|ll)=|!3d)(-?\d{1,3}\.\d+)[,%!]+(-?\d{1,3}\.\d+)/i);
    if (!match) return Response.json({ error: "This Maps link does not contain a shared location." }, { status: 422 });
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return Response.json({ error: "Coordinates are outside valid ranges." }, { status: 422 });
    return Response.json({ latitude, longitude }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Google Maps link could not be opened. Paste the coordinates instead." }, { status: 422 }); }
}
