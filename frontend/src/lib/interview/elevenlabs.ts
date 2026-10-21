const ELEVENLABS_MODEL = "eleven_multilingual_v2";

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new Error("ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID no configuradas");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `ElevenLabs TTS falló (${response.status}): ${detail.slice(0, 200)}`,
    );
  }

  return response.arrayBuffer();
}

export function arrayBufferToDataUrl(
  buffer: ArrayBuffer,
  mimeType = "audio/mpeg",
): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/** Versión server-side (Node) sin btoa global */
export function arrayBufferToDataUrlNode(
  buffer: ArrayBuffer,
  mimeType = "audio/mpeg",
): string {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}
