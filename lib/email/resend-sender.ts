import type { EmailMessage, EmailSender } from "./email";

/**
 * Production email sender backed by the Resend HTTP API (resend.com).
 *
 * - Uses the platform `fetch` (works on Node 20+, Vercel, Cloudflare Workers);
 *   no SMTP/Node-only dependency.
 * - `from` must use a sending domain verified in Resend (DNS MX/SPF/DKIM — see
 *   DEPLOYMENT.md §4). Credentials are owner-provided (SPEC §22), read from env.
 * - Server-only.
 */
export class ResendEmailSender implements EmailSender {
  readonly name = "resend";
  private readonly apiKey: string;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    if (!apiKey || !from) {
      throw new Error("ResendEmailSender requires apiKey and from address.");
    }
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(message: EmailMessage): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });
    if (!res.ok) {
      // Surface the provider error for the caller's logs; do not crash the
      // request — email failures are non-fatal to the auth flow (the link is
      // also shown in dev console). Caller already handles send() as best-effort.
      const detail = await res.text().catch(() => "");
      console.error(`[Resend] send failed (${res.status}): ${detail}`);
    }
  }
}
