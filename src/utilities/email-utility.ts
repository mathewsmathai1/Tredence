import * as nodemailer from "nodemailer";
//import {smtpTransport} = require('nodemailer-smtp-transport');
//import {xoauth2} from 'xoauth2';

export class EmailService {
  static smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASS,
    },
  });

  //   transport = nodemailer.createTransport(
  //     smtpTransport({
  //       service: 'Gmail',
  //       auth: {
  //         xoauth2: xoauth2.createXOAuth2Generator({
  //           user: 'abc@gmail.com',
  //         }),
  //       },
  //     }),
  //   );

  static prepEmail(
    targetMailId: string,
    mailSubject: string,
    mailBody: string
  ) {
    //console.log('smtpTransport: ', this.smtpTransport);
    const mailOptions = {
      to: targetMailId,
      subject: mailSubject,
      html: mailBody,
    };
    console.log(mailOptions);
    return mailOptions;
  }

  static sendMail(mailOptions: any) {
    EmailService.smtpTransport.sendMail(
      mailOptions,
      function (error, response) {
        if (error) {
          console.log(error);
        } else {
          console.log("Message sent");
        }
      }
    );
  }
}
