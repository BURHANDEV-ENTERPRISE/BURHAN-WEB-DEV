import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params;
  const res = await fetch(`https://mc-heads.net/skin/${uuid}`, {
    headers: { "User-Agent": "BurhanDev/1.0" },
  });
  if (!res.ok) return new NextResponse(null, { status: 404 });
  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":                "image/png",
      "Cache-Control":               "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
