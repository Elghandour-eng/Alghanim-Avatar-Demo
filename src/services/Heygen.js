import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
} from "@heygen/streaming-avatar/lib/index.esm.js";
import fetch from "node-fetch";
import * as axios from "axios";
import NodeCache from "node-cache";
import config from "../config/config.js";

const sessionCache = new NodeCache({ stdTTL: 3600 }); // Cache sessions for 1 hour
const { HEYGEN_API_KEY } = config;
class HeygenService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    console.log("HeygenService initialized with API Key", this.apiKey);
    this.streamingAvatar = axios.default.create({
      baseURL: "https://api.heygen.com",
      headers: {
        "x-api-key": this.apiKey,
      },
    });
  }

  async getVoices(language = null, gender = null) {
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
  async getAvatars(gender = null) {
    const options = {
      method: "GET",
      headers: { accept: "application/json", "x-api-key": this.apiKey },
    };
    let avatars = [];
    if (sessionCache.has("avatars")) {
      console.log("🗃️ Returning cached avatars");
      avatars = sessionCache.get("avatars");
    } else {
      console.log("🔄 No cached avatars, fetching from HeyGen API");
      const response = await fetch(
        "https://api.heygen.com/v2/avatars",
        options
      );
      const data = await response.json();
      avatars = data?.data?.avatars || [];
      if (!avatars.length) {
        throw new Error("No avatars found from HeyGen API");
      }
      if (avatars.length) {
        sessionCache.set("avatars", avatars);
      }
    }
    if (gender) {
      avatars = avatars.filter(
        (avatar) => avatar.gender.toLowerCase() === gender.toLowerCase()
      );
    }
    return avatars;
  }
  async createSession(avatarId, voiceId) {
    console.log(
      "🎭 Creating HeyGen session with Avatar ID:",
      avatarId,
      "Voice ID:",
      voiceId
    );
    const response = await this.streamingAvatar.post("/v1/streaming.new", {
      avatar_name: avatarId,
      voice: { voice_id: voiceId },
      quality: "high" /* AvatarQuality.High */,
    });

    return response.data;
  }
}

const heygenService = new HeygenService(HEYGEN_API_KEY);
export default heygenService;
