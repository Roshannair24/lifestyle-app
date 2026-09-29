const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
});

async function sendOtpEmail(to, code) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "PadosiPro <no-reply@padosipro.local>",
    to,
    subject: "Your PadosiPro verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes. If you didn't sign up, ignore this email.`,
  });
}

module.exports = { sendOtpEmail };