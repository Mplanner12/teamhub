import nodemailer from "nodemailer";
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  });

  // Generate plain text from HTML if not provided
  const plainText =
    text ||
    html
      .replace(/<h[1-6]>(.*?)<\/h[1-6]>/g, "$1\n\n")
      .replace(/<p>(.*?)<\/p>/g, "$1\n\n")
      .replace(/<a href="(.*?)">(.*?)<\/a>/g, "$2: $1")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<(?:.|\n)*?>/g, "")
      .replace(/\n\s+/g, "\n\n")
      .trim();

  await transporter.sendMail({
    from: `"TeamHub" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    text: plainText,
    html: html,
  });

  console.log(`Email sent to ${to} with subject: ${subject}`);
};
