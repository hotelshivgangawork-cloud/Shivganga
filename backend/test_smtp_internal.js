import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const testSmtp = async (user, pass) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    console.log(`✅ Success with user: ${user} and pass: ${pass.substring(0, 10)}...`);
    return true;
  } catch (error) {
    console.log(`❌ Failed with user: ${user}. Error: ${error.message}`);
    return false;
  }
};

const runTests = async () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const apiKey = "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"; // from Shivganga.env

  console.log("Testing current .env config...");
  await testSmtp(smtpUser, smtpPass);

  console.log("\nTesting with xkeysib API key as password...");
  await testSmtp(smtpUser, apiKey);
};

runTests();
