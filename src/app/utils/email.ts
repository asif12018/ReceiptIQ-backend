import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import config from "../config";

export const sendEmail = async (options: {
  to: string;
  subject: string;
  templateName: string;
  templateData: any;
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: config.SMTP_USER,
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        refreshToken: config.GOOGLE_REFRESH_TOKEN,
      },
    });

    // Render the EJS template
    const templatePath = path.join(process.cwd(), "src/app/views", `${options.templateName}.ejs`);
    const html = await ejs.renderFile(templatePath, options.templateData) as string;

    const mailOptions = {
      from: `"ReceiptIQ" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};
