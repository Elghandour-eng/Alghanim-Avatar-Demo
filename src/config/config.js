require("dotenv").config();

module.exports = {
  AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY,
  AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION,
  VOICE_ID: process.env.VOICE_ID,
  FALLBACK_VOICE_ID: process.env.FALLBACK_VOICE_ID,
  AVATAR_ID: process.env.AVATAR_ID,
  HEYGEN_API_KEY: process.env.HEYGEN_API_KEY,
  DIFY_API_KEY: process.env.DIFY_API_KEY,
  db: {
    uri: process.env.DB_URI,
  },
};
