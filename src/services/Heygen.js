// const StreamingAvatar = require("@heygen/streaming-avatar");
// const { AvatarQuality, StreamingEvents } = require("@heygen/streaming-avatar");
const NodeCache = require("node-cache");
const sessionCache = new NodeCache({ stdTTL: 3600 }); // Cache sessions for 1 hour
const { HEYGEN_API_KEY } = require("../config/config");
class HeygenService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getVoices(language = null, gender = null) {
    const fetch = (await import("node-fetch")).default;
    const options = {
      method: "GET",
      headers: { accept: "application/json", "x-api-key": this.apiKey },
    };
    let voices = [];
    if (sessionCache.has("voices")) {
      console.log("🗃️ Returning cached voices");
      voices = sessionCache.get("voices");
    } else {
      console.log("🔄 No cached voices, fetching from HeyGen API");
      const response = await fetch("https://api.heygen.com/v2/voices", options);
      const data = await response.json();
      voices = data?.data?.voices || [];
      if (!voices.length) {
        throw new Error("No voices found from HeyGen API");
      }
      if (voices.length) {
        sessionCache.set("voices", voices);
      }
    }
    if (language) {
      voices = voices.filter(
        (voice) => voice.language.toLowerCase() === language.toLowerCase()
      );
    }
    if (gender) {
      voices = voices.filter(
        (voice) => voice.gender.toLowerCase() === gender.toLowerCase()
      );
    }
    return voices;
  }
}

const heygenService = new HeygenService(HEYGEN_API_KEY);
module.exports = heygenService;
