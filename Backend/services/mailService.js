import nodemailer from "nodemailer";
import logger from "../utils/logger.js";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendMail = async ({ to, subject, html, text }) => {
  const msg = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html
  };
  try {
    const info = await transporter.sendMail(msg);
    logger.info(`Email sent to ${to} - ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error("Mail error", err);
    throw err;
  }
};
