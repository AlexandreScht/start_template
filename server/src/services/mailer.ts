import env from '@/config';
import { mailerConfig } from '@/config/mailer';
import { ServicesError } from '@/exceptions';
import { logger } from '@/utils/logger';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { join } from 'path';
import { Service } from 'typedi';
import util from 'util';

@Service()
export default class MailerServiceClass {
  private transporter: nodemailer.Transporter;
  private template_dir: string = join(__dirname, '../templates');
  private support_mail: string = env.MAILER_SUPPORT;

  constructor() {
    this.transporter = nodemailer.createTransport(
      { ...mailerConfig },
      {
        from: env.MAILER_FROM,
      },
    );
  }

  private async sendMailAsync(mailOptions: nodemailer.SendMailOptions) {
    try {
      const sendMail = util.promisify(this.transporter.sendMail).bind(this.transporter);

      await sendMail(mailOptions);
    } catch (error) {
      logger.error('MailerService.sendMailAsync => ', error);
      throw new ServicesError();
    }
  }

  async already_register(email: string) {
    try {
      const confirmationEmail = fs.readFileSync(join(this.template_dir, 'already_register.html'), {
        encoding: 'utf-8',
      });
      const htmlMailer = confirmationEmail
        .replace('{{support_MAIL}}', this.support_mail)
        .replace('{{login_link}}', `${env.ORIGIN}/login}`)
        .replace('{{reset_link}}', `${env.ORIGIN}/reset-link}`);

      const mailOptions = {
        to: email,
        subject: 'Votre compte est déja disponible',
        html: htmlMailer,
      };

      await this.sendMailAsync(mailOptions);
    } catch (error) {
      logger.error('MailerService.Registration => ', error);
      throw new ServicesError();
    }
  }

  async new_register(email: string, token: string, code: string) {
    try {
      if (!/^\d{4}$/.test(code)) {
        throw new ServicesError('Code must be a 4-digit number');
      }
      const confirmationEmail = fs.readFileSync(join(this.template_dir, 'new_register.html'), { encoding: 'utf-8' });
      const htmlMailer = confirmationEmail
        .replace('{{support_MAIL}}', this.support_mail)
        .replace('{{link}}', `${env.ORIGIN}/confirm-account/${encodeURIComponent(token)}`)
        .replaceAll('{{code1}}', code[0])
        .replaceAll('{{code2}}', code[1])
        .replaceAll('{{code3}}', code[2])
        .replaceAll('{{code4}}', code[3]);

      const mailOptions = {
        to: email,
        subject: 'Terminez votre inscription en saisissant ce code',
        html: htmlMailer,
      } satisfies nodemailer.SendMailOptions;

      await this.sendMailAsync(mailOptions);
    } catch (error) {
      logger.error('MailerService.Registration => ', error);
      throw new ServicesError();
    }
  }
  async new_confirmed_register(email: string) {
    try {
      const confirmationEmail = fs.readFileSync(join(this.template_dir, 'new_confirmed_register.html'), {
        encoding: 'utf-8',
      });
      const htmlMailer = confirmationEmail.replace('{{support_MAIL}}', this.support_mail);

      const mailOptions = {
        to: email,
        subject: 'Votre compte a bien été créé et est dès à présent actif sur notre site web.',
        html: htmlMailer,
      };

      await this.sendMailAsync(mailOptions);
    } catch (error) {
      logger.error('MailerService.Registration => ', error);
      throw new ServicesError();
    }
  }
}
