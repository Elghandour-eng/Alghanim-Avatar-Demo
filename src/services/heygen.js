import fetch from "node-fetch";
import NodeCache from "node-cache";
import config from "../config/config.js";

const sessionCache = new NodeCache({ stdTTL: 3600 }); // Cache sessions for 1 hour
const { HEYGEN_API_KEY } = config;

class HeygenService {
  constructor(apiKey) {
    this.apiKey = apiKey;
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
    const response = await fetch("https://api.heygen.com/v1/streaming.new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        avatar_name: avatarId,
        voice: { voice_id: voiceId },
        quality: "high",
      }),
    });
    return response.json();
  }

  async startSession(sessionId, sdp) {
    const response = await fetch("https://api.heygen.com/v1/streaming.start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.apiKey,
      },
      body: JSON.stringify({ session_id: sessionId, sdp }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HeyGen API error: ${response.status} ${errorText}`);
    }
    return response.json();
  }

  async handleIce(sessionId, candidate) {
    const response = await fetch("https://api.heygen.com/v1/streaming.ice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.apiKey,
      },
      body: JSON.stringify({ session_id: sessionId, candidate }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HeyGen API error: ${response.status} ${errorText}`);
    }
    return response.json();
  }

  async speak(sessionId, text) {
    const response = await fetch("https://api.heygen.com/v1/streaming.task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.apiKey,
      },
      body: JSON.stringify({ session_id: sessionId, text }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HeyGen API error: ${response.status} ${errorText}`);
    }
    return response.json();
  }

  async stopSession(sessionId) {
    const response = await fetch("https://api.heygen.com/v1/streaming.stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.apiKey,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HeyGen API error: ${response.status} ${errorText}`);
    }
    return response.json();
  }
}

const heygenService = new HeygenService(HEYGEN_API_KEY);
export default heygenService;
