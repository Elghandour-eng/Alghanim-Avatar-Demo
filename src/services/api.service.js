import fetch from "node-fetch";

const apiService = {
  getSpeechConfig() {
    return {
      region: process.env.AZURE_SPEECH_REGION,
      success: true,
    };
  },

  async getSpeechToken() {
    const tokenUrl = `https://${process.env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response.ok) {
      const token = await response.text();
      return {
        token: token,
        region: process.env.AZURE_SPEECH_REGION,
      };
    } else {
      throw new Error("Failed to get token");
    }
  },
};

export default apiService;
