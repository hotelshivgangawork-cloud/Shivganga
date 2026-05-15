import nodemailer from "nodemailer";

const testSmtp = async (host) => {
  const transporter = nodemailer.createTransport({
    host: host,
    port: 587,
    secure: false,
    auth: { 
      user: "a44021001@smtp-brevo.com", 
      pass: "xsmtpsib-987b20cad967b512302863b89d65b0f2664a5092cd84ca5ff3f41819fc6e605d-liBaf3ARoAFlJLOL" 
    },
  });

  try {
    await transporter.verify();
    console.log(`✅ Success with Host: ${host}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed with Host: ${host}. Error: ${error.message}`);
    return false;
  }
};

const runTests = async () => {
  await testSmtp("smtp-relay.brevo.com");
  await testSmtp("smtp-relay.sendinblue.com");
};

runTests();
