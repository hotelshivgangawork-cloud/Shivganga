import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const testApi = async (apiKey) => {
  try {
    const response = await axios.get("https://api.brevo.com/v3/account", {
      headers: {
        "api-key": apiKey,
        "accept": "application/json"
      }
    });
    console.log("✅ API Success! Account email:", response.data.email);
    return true;
  } catch (error) {
    console.log("❌ API Failed. Error:", error.response?.data?.message || error.message);
    return false;
  }
};

const runTests = async () => {
  const apiKeyShivganga = "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";
  const apiKeyDotEnv = process.env.BREVO_API_KEY;

  console.log("Testing API with xkeysib (from Shivganga.env)...");
  await testApi(apiKeyShivganga);

  console.log("\nTesting API with xsmtpsib (from .env)...");
  await testApi(apiKeyDotEnv);
};

runTests();
