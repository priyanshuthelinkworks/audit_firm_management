import nodemailer from "nodemailer";

// import { AdminController } from '#abserve/Module/Auth/Controller/AdminController';
// import { UserController } from '#abserve/Module/Auth/Controller/UserController';
// import { ProviderController } from '#abserve/Module/Auth/Controller/ProviderController';
import Config from "#wms/Config/database";

// interface MailGateway extends AdminController, UserController, ProviderController { }
// interface MailGateway { }

class EmailController {
  constructor() {
    // super()
  }
  static sendMail = async (email, otp ,message,text,subject="Verification from Linkwork") => {
    // if (Config.emailGateway.name == "gmail") {
      const smtpConfig = {
        service:"gmail",
        host: 'smtp.gmail.com',
        port: 587, // Use the appropriate port for your email provider
        secure: false, // Set to true if using a secure connection (e.g., for Gmail)
        auth: {
          user: 'testinglinkworks@gmail.com',
          pass: 'udydvzcifbluhmsz',
        },
      };
      
      let mailoption = {
        from: Config.mailFrom,
        to: email,
        subject,
        html: message ||`The verification code sent to your email is ${otp?.toString()}. Please enter this code to complete the  process.`,
        text: text||"OTP",
       };
      let mailTransporter = nodemailer.createTransport(smtpConfig);

      mailTransporter.sendMail(mailoption, (error) => {
        if (error) {
          console.log("err", error, "err");
          return false;
        }
      });
      return true;
    }
  //};
}
export { EmailController };
