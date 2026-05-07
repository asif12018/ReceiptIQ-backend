"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../config"));
const sendEmail = async (options) => {
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: config_1.default.SMTP_USER,
                clientId: config_1.default.GOOGLE_CLIENT_ID,
                clientSecret: config_1.default.GOOGLE_CLIENT_SECRET,
                refreshToken: config_1.default.GOOGLE_REFRESH_TOKEN,
            },
        });
        // Render the EJS template
        const templatePath = path_1.default.join(process.cwd(), "src/app/views", `${options.templateName}.ejs`);
        const html = await ejs_1.default.renderFile(templatePath, options.templateData);
        const mailOptions = {
            from: `"ReceiptIQ" <${process.env.SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            html,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.messageId}`);
    }
    catch (error) {
        console.error("Error sending email: ", error);
    }
};
exports.sendEmail = sendEmail;
