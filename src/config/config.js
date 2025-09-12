import "dotenv/config";

export default {
  AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY,
  AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION,
  VOICE_ID: process.env.VOICE_ID,
  FALLBACK_VOICE_ID: process.env.FALLBACK_VOICE_ID,
  AVATAR_ID: process.env.AVATAR_ID,
  HEYGEN_API_KEY: process.env.HEYGEN_API_KEY,
  DIFY_API_KEY: process.env.DIFY_API_KEY,
  DIFY_WORKFLOW_API_KEY: process.env.DIFY_WORKFLOW_API_KEY,
  DIFY_API_ENDPOINT: process.env.DIFY_API_ENDPOINT || "https://api.dify.ai",
  CRON_SCHEDULE: process.env.CRON_SCHEDULE || "*/10 * * * *", // Default: every 10 minutes
  INACTIVITY_THRESHOLD_MINUTES:
    parseInt(process.env.INACTIVITY_THRESHOLD_MINUTES) || 10, // Default: 10 minutes
  PORT: process.env.PORT || 3000,
  db: {
    uri: process.env.DB_URI,
  },
};
