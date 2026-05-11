import { google } from "googleapis";
import ejs from "ejs";
import path from "path";
import config from "../config";

const OAuth2 = google.auth.OAuth2;

const createGmailClient = () => {
  const oauth2Client = new OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: config.GOOGLE_REFRESH_TOKEN,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
};

export const sendEmail = async (options: {
  to: string;
  subject: string;
  templateName: string;
  templateData: any;
}) => {
  try {
    const gmail = createGmailClient();

    // Render the EJS template
    const templatePath = path.join(
      process.cwd(),
      "src/app/views",
      `${options.templateName}.ejs`
    );
    const html = (await ejs.renderFile(
      templatePath,
      options.templateData
    )) as string;

    // Construct raw email according to RFC 2822
    // Subject must be encoded to support special characters
    const utf8Subject = `=?utf-8?B?${Buffer.from(options.subject).toString(
      "base64"
    )}?=`;
    const messageParts = [
      `From: ReceiptIQ <${config.SMTP_USER}>`,
      `To: ${options.to}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
      "",
      html,
    ];
    const message = messageParts.join("\n");

    // The Gmail API requires the email to be base64url encoded
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send the email via the true HTTP REST API
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`Email successfully sent via Gmail API: ${res.data.id}`);
  } catch (error) {
    console.error("Error sending email via Gmail API: ", error);
  }
};
