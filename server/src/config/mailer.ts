import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import env from './index';

export const mailerConfig = {
  host: env.MAILER_HOST,
  port: Number(env.MAILER_PORT),
  secure: Number(env.MAILER_PORT) === 465,
  tls: {
    rejectUnauthorized: false,
  },
  auth: {
    user: env.MAILER_USER,
    pass: env.MAILER_PASSWORD,
  },
} satisfies SMTPTransport | SMTPTransport.Options | string;
