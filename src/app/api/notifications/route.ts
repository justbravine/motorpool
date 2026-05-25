import { NextResponse } from "next/server";
import { Resend } from "resend";

type NotificationPayload =
  | {
      to: string;
      type: "test";
    }
  | {
      to: string;
      requesterName?: string;
      status: "Approved" | "Rejected" | "Reopened";
      destination: string;
      startTime: string;
      endTime: string;
    };

const isTestPayload = (payload: NotificationPayload): payload is { to: string; type: "test" } =>
  "type" in payload && payload.type === "test";

const resend = new Resend(process.env.RESEND_API_KEY);

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const renderEmailLayout = (options: {
  title: string;
  subtitle: string;
  body: string;
  statusTone?: "success" | "warning" | "danger";
  cta?: { label: string; href: string };
}) => {
  const tones = {
    success: { accent: "#53d6b0", badge: "#ecfdf5", badgeText: "#047857" },
    warning: { accent: "#f7c77b", badge: "#fff7ed", badgeText: "#b45309" },
    danger: { accent: "#fda4af", badge: "#fef2f2", badgeText: "#b91c1c" },
  };
  const tone = tones[options.statusTone ?? "success"];

  return `
    <div style="background:#0b1214; padding:28px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px; margin:0 auto; background:#111c1f; border-radius:20px; border:1px solid #1f2e33; font-family:Arial, sans-serif; color:#e5f3f0; overflow:hidden;">
        <tr>
          <td style="padding:22px 24px; border-bottom:1px solid #1f2e33;">
            <div style="font-size:11px; letter-spacing:0.28em; text-transform:uppercase; color:${tone.accent}; font-weight:700;">Fleet Command</div>
            <div style="font-size:22px; font-weight:700; margin-top:6px;">${options.title}</div>
            <div style="margin-top:8px; font-size:13px; color:#b7c9c6;">${options.subtitle}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;">
            ${options.body}
            ${
              options.cta
                ? `
                  <div style="margin-top:18px;">
                    <a href="${options.cta.href}" style="display:inline-block; padding:10px 18px; background:${tone.accent}; color:#0b1214; text-decoration:none; font-weight:700; border-radius:999px; font-size:13px;">
                      ${options.cta.label}
                    </a>
                  </div>
                `
                : ""
            }
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px; border-top:1px solid #1f2e33; font-size:11px; color:#8ca3a0;">
            Dispatch notifications are sent for approved and rejected requests. Reply to this email if you need help.
          </td>
        </tr>
      </table>
    </div>
  `;
};

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
  }

  const payload = (await request.json()) as NotificationPayload;

  if (!payload?.to) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const from = process.env.RESEND_FROM || "Fleet Command <onboarding@resend.dev>";

  if (isTestPayload(payload)) {
    const subject = "Resend test from Fleet Command";
    const body = `
      <div style="padding:14px 16px; border-radius:14px; background:#f0fdfa; border:1px solid #1f2e33; color:#0f172a; font-size:13px; font-weight:600;">
        Domain verified. Ready to send production notifications.
      </div>
      <p style="margin:16px 0 0; color:#c7d9d6; font-size:13px;">If you did not request this test, ignore this message.</p>
    `;
    const html = renderEmailLayout({
      title: "Test email",
      subtitle: "Your Resend integration is working.",
      body,
      statusTone: "success",
    });

    await resend.emails.send({
      from,
      to: payload.to,
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  }
  const statusLine = payload.status === "Reopened" ? "Reopened for review" : payload.status;
  const subject = `Trip request ${statusLine} - ${payload.destination}`;
  const requester = payload.requesterName || "Driver";
  const start = formatDate(payload.startTime);
  const end = formatDate(payload.endTime);
  const tone = payload.status === "Rejected" ? "danger" : payload.status === "Reopened" ? "warning" : "success";
  const body = `
    <p style="margin:0 0 16px; color:#c7d9d6;">Hi ${requester}, your trip request has been <strong>${statusLine.toLowerCase()}</strong>.</p>
    <div style="padding:16px; border-radius:14px; background:#f8fafc; border:1px solid #e2e8f0; color:#0f172a;">
      <div style="font-size:14px; font-weight:700; margin-bottom:6px;">${payload.destination}</div>
      <div style="font-size:13px; margin-bottom:4px;"><strong>Departure:</strong> ${start}</div>
      <div style="font-size:13px;"><strong>Return:</strong> ${end}</div>
    </div>
    <div style="margin-top:14px; font-size:12px; color:#9fb3b0;">If you have questions, contact dispatch.</div>
  `;
  const html = renderEmailLayout({
    title: `Trip request ${statusLine}`,
    subtitle: "Dispatch decision update",
    body,
    statusTone: tone,
  });

  await resend.emails.send({
    from,
    to: payload.to,
    subject,
    html,
  });

  return NextResponse.json({ ok: true });
}
