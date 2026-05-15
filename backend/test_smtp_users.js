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
    console.log(`✅ Success with user: ${user}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed with user: ${user}. Error: ${error.message}`);
    return false;
  }
};

const runTests = async () => {
  const smtpPass = "xsmtpsib-987b20cad967b512302863b89d65b0f2664a5092cd84ca5ff3f41819fc6e605d-liBaf3ARoAFlJLOL";
  const usersToTest = [
    "a44021001@smtp-brevo.com",
    "hotelshivgangawork@gmail.com"
  ];

  for (const user of usersToTest) {
    await testSmtp(user, smtpPass);
  }
};

runTests();
