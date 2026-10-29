export const NERVIO_EMAIL = {
  background: "#0f131d",
  card: "#171b26",
  foreground: "#dfe2f1",
  muted: "#bbc9cd",
  border: "rgba(255, 255, 255, 0.1)",
  primary: "#8aebff",
  primaryForeground: "#00363e",
  secondary: "#ddb7ff",
  radius: "12px",
} as const;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface NervioEmailDetailRow {
  label: string;
  value: string;
}

export interface BuildNervioEmailInput {
  preheader: string;
  badge?: string;
  heading: string;
  intro: string;
  detailRows: NervioEmailDetailRow[];
  ctaHref?: string;
  ctaLabel?: string;
  footerNote?: string;
  secondaryLink?: { href: string; label: string };
}

export function buildNervioEmail(input: BuildNervioEmailInput): string {
  const t = NERVIO_EMAIL;
  const rows = input.detailRows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;color:${t.muted};font-size:14px;width:120px;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 0;color:${t.foreground};font-size:14px;font-weight:500;">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join("");

  const badge = input.badge
    ? `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:rgba(138,235,255,0.15);color:${t.primary};font-size:12px;font-weight:600;letter-spacing:0.02em;">${escapeHtml(input.badge)}</span>`
    : "";

  const cta =
    input.ctaHref && input.ctaLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
          <tr>
            <td style="border-radius:${t.radius};background:${t.primary};">
              <a href="${input.ctaHref}" style="display:inline-block;padding:14px 24px;color:${t.primaryForeground};font-size:15px;font-weight:700;text-decoration:none;">${escapeHtml(input.ctaLabel)}</a>
            </td>
          </tr>
        </table>`
      : "";

  const secondary = input.secondaryLink
    ? `<p style="margin:16px 0 0;font-size:14px;color:${t.muted};">
        <a href="${input.secondaryLink.href}" style="color:${t.secondary};text-decoration:underline;">${escapeHtml(input.secondaryLink.label)}</a>
      </p>`
    : "";

  const footer = input.footerNote
    ? `<p style="margin:24px 0 0;font-size:12px;color:${t.muted};line-height:1.5;">${escapeHtml(input.footerNote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${t.background};font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.background};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:20px;text-align:center;">
              <span style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:${t.primary};">Nervio</span>
            </td>
          </tr>
          <tr>
            <td style="background:${t.card};border:1px solid ${t.border};border-radius:${t.radius};padding:28px 24px;">
              ${badge ? `<div style="margin-bottom:16px;">${badge}</div>` : ""}
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:${t.foreground};font-weight:700;">${escapeHtml(input.heading)}</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${t.muted};">${escapeHtml(input.intro)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${t.border};">
                ${rows}
              </table>
              ${cta}
              ${secondary}
              ${footer}
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;text-align:center;font-size:12px;color:${t.muted};">
              Nervio — simulador de entrevistas con IA
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
