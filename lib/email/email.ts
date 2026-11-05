import { ResendEmailSender } from "./resend-sender";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSender {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

/**
 * Dev email sender: prints the message (including any verification/reset links)
 * to the server console so the flow is testable without an SMTP server.
 */
class ConsoleEmailSender implements EmailSender {
  readonly name = "console";
  async send(message: EmailMessage): Promise<void> {
    console.log(`\n[DEV EMAIL]\nTo: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`);
  }
}

let sender: EmailSender | null = null;

/**
 * Resolve the active email sender.
 *
 * - When `RESEND_API_KEY` + `EMAIL_FROM` are present, a real `ResendEmailSender`
 *   is used (production). Credentials are owner-provided (SPEC §22).
 * - Otherwise, the `ConsoleEmailSender` logs the message so the auth flow stays
 *   testable in dev without an email service.
 */
export function getEmailSender(): EmailSender {
  if (sender) return sender;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (apiKey && from) {
    try {
      sender = new ResendEmailSender(apiKey, from);
      return sender;
    } catch {
      sender = new ConsoleEmailSender();
      return sender;
    }
  }
  sender = new ConsoleEmailSender();
  return sender;
}

/** Test/override hook. */
export function setEmailSender(s: EmailSender): void {
  sender = s;
}
