import { Injectable } from '@nestjs/common';

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

@Injectable()
export class EmailerService {
  async sendEmail({ email, subject, html }: { email: string; subject: string; html: string }) {
    const { data, error } = await resend.emails.send({
      from: "Content Manager <info@automarket.agency>",
      to: [email],
      subject,
      html,
    });

    console.log("data", data);
    console.log("error", error);
  }
}
