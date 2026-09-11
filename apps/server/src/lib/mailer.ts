import nodemailer from 'nodemailer';
import type { ContactData } from './validate';

/**
 * Sends the contact-form email via SMTP (configured through env vars). Works
 * with any SMTP provider — your own mail server or e.g. Resend's SMTP gateway.
 *
 * If SMTP_HOST is not set, the submission is logged instead of sent — so the
 * endpoint is fully testable locally without credentials.
 *
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_SECURE ("true" for 465),
 *   SMTP_USER, SMTP_PASS, CONTACT_TO, CONTACT_FROM
 */

let transporter: nodemailer.Transporter | null | undefined;

function getTransport(): nodemailer.Transporter | null {
  if (transporter !== undefined) return transporter;
  const host = import.meta.env.SMTP_HOST ?? process.env.SMTP_HOST;
  if (!host) {
    transporter = null;
    return null;
  }
  const smtpUser = import.meta.env.SMTP_USER ?? process.env.SMTP_USER;
  transporter = nodemailer.createTransport({
    host,
    port: Number(import.meta.env.SMTP_PORT ?? process.env.SMTP_PORT ?? 587),
    secure: (import.meta.env.SMTP_SECURE ?? process.env.SMTP_SECURE) === 'true',
    auth: smtpUser
      ? { user: smtpUser, pass: import.meta.env.SMTP_PASS ?? process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export async function sendContactEmail(data: ContactData): Promise<{ delivered: boolean }> {
  const to = import.meta.env.CONTACT_TO ?? process.env.CONTACT_TO ?? 'contact@time2map.com';
  const subject = `New contact request from ${data.name}`;
  const text = [
    `Name:    ${data.name}`,
    `Email:   ${data.email}`,
    `Budget:  ${data.budget}`,
    '',
    data.message,
  ].join('\n');

  const transport = getTransport();
  if (!transport) {
    console.log(`[contact] SMTP not configured — would email ${to}:\n${text}`);
    return { delivered: false };
  }

  await transport.sendMail({
    from: import.meta.env.CONTACT_FROM ?? process.env.CONTACT_FROM ?? `"time2map website" <${to}>`,
    to,
    replyTo: data.email,
    subject,
    text,
  });
  return { delivered: true };
}
