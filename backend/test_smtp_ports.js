import nodemailer from "nodemailer";

const testSmtp = async (port, secure) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: port,
    secure: secure,
    auth: { 
      user: "a44021001@smtp-brevo.com", 
      pass: "xsmtpsib-987b20cad967b512302863b89d65b0f2664a5092cd84ca5ff3f41819fc6e605d-liBaf3ARoAFlJLOL" 
    },
  });

  try {
    await transporter.verify();
    console.log(`✅ Success with Port: ${port}, Secure: ${secure}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed with Port: ${port}, Secure: ${secure}. Error: ${error.message}`);
    return false;
  }
};

const runTests = async () => {
  await testSmtp(587, false);
  await testSmtp(465, true);
};

runTests();
