import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    if (!apiKey || !agentId) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY o ELEVENLABS_AGENT_ID no configuradas" },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`,
      {
        headers: { "xi-api-key": apiKey },
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("ElevenLabs token error:", response.status, detail);
      return NextResponse.json(
        { error: "No se pudo obtener el token de conversación" },
        { status: 502 },
      );
    }

    const body = (await response.json()) as { token: string };
    return NextResponse.json({ token: body.token });
  } catch (error) {
    console.error("GET /api/elevenlabs/token error:", error);
    return NextResponse.json(
      { error: "Error interno al obtener token" },
      { status: 500 },
    );
  }
}
