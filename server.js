const express = require("express");
const cors = require("cors");
const path = require("path");
const LLMProvider = require("./llm-provider");
require("dotenv").config();

console.log("🚀 Starting  Avatar  Server...");
console.log("📋 Environment variables loaded");
console.log(`🔧 Node environment: ${process.env.NODE_ENV || "development"}`);

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`⚙️  Server will run on port: ${PORT}`);

// Middleware
console.log("🔧 Setting up middleware...");
app.use(cors());
console.log("✅ CORS middleware enabled");

app.use(express.json());
console.log("✅ JSON parsing middleware enabled");

// Store conversation IDs for users (in production, use a proper database)
const userConversations = new Map();
console.log('💾 User conversations storage initialized');

// Initialize LLM Provider
const llmProvider = new LLMProvider();
console.log('🤖 LLM Provider initialized');

// Store active HeyGen sessions and their keep-alive intervals
const activeSessions = new Map();
console.log('🎭 Active sessions storage initialized');

// Keep-alive interval (in milliseconds) - send keep-alive every 30 seconds
const KEEP_ALIVE_INTERVAL = 30000;

// Function to start keep-alive for a session
function startKeepAlive(sessionId) {
    console.log(`🔄 Starting keep-alive for session: ${sessionId}`);
    
    // Clear any existing interval for this session
    if (activeSessions.has(sessionId)) {
        const existingData = activeSessions.get(sessionId);
        if (existingData.keepAliveInterval) {
            clearInterval(existingData.keepAliveInterval);
        }
    }
    
    // Create new keep-alive interval
    const keepAliveInterval = setInterval(async () => {
        try {
            console.log(`💓 Sending keep-alive for session: ${sessionId}`);
            const fetch = (await import("node-fetch")).default;
            
            const response = await fetch("https://api.heygen.com/v1/streaming.keep_alive", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Api-Key": process.env.HEYGEN_API_KEY,
                },
                body: JSON.stringify({ session_id: sessionId }),
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Keep-alive successful for session: ${sessionId}`);
                
                // Update session data
                const sessionData = activeSessions.get(sessionId) || {};
                sessionData.lastKeepAlive = new Date();
                sessionData.keepAliveInterval = keepAliveInterval;
                activeSessions.set(sessionId, sessionData);
            } else {
                const errorText = await response.text();
                console.error(`❌ Keep-alive failed for session ${sessionId}:`, errorText);
                
                // If keep-alive fails, stop the interval and remove session
                clearInterval(keepAliveInterval);
                activeSessions.delete(sessionId);
            }
        } catch (error) {
            console.error(`❌ Keep-alive error for session ${sessionId}:`, error);
            // Continue trying unless it's a critical error
        }
    }, KEEP_ALIVE_INTERVAL);
    
    // Store session data
    const sessionData = {
        sessionId,
        keepAliveInterval,
        createdAt: new Date(),
        lastKeepAlive: new Date()
    };
    activeSessions.set(sessionId, sessionData);
}

// Function to stop keep-alive for a session
function stopKeepAlive(sessionId) {
    console.log(`🛑 Stopping keep-alive for session: ${sessionId}`);
    
    if (activeSessions.has(sessionId)) {
        const sessionData = activeSessions.get(sessionId);
        if (sessionData.keepAliveInterval) {
            clearInterval(sessionData.keepAliveInterval);
        }
        activeSessions.delete(sessionId);
        console.log(`✅ Keep-alive stopped for session: ${sessionId}`);
    }
}

// Function to get session status
function getSessionStatus(sessionId) {
    if (activeSessions.has(sessionId)) {
        const sessionData = activeSessions.get(sessionId);
        return {
            active: true,
            createdAt: sessionData.createdAt,
            lastKeepAlive: sessionData.lastKeepAlive,
            uptime: Date.now() - sessionData.createdAt.getTime()
        };
    }
    return { active: false };
}

// Function to parse Dify response format
function parseDifyResponse(responseData) {
    try {
        console.log('🔍 Parsing PAIR response:', responseData);
        
        // Check if responseData is empty or null
        if (!responseData || responseData === '') {
            console.warn('⚠️ Warning: Empty or null PAIR response data');
            return {
                message: '',
                is_media: 0,
                media_url: '',
                hasMedia: false,
                isValid: false,
                error: 'Empty response data'
            };
        }
        
        // Handle both string and object inputs
        let parsedData;
        if (typeof responseData === 'string') {
            // Trim whitespace and check if string is empty
            const trimmedData = responseData.trim();
            if (trimmedData === '') {
                console.warn('⚠️ Warning: Empty string in PAI response');
                return {
                    message: '',
                    is_media: 0,
                    media_url: '',
                    hasMedia: false,
                    isValid: false,
                    error: 'Empty string response'
                };
            }
            
            // Check for markdown code block syntax and clean it
            let jsonContent = trimmedData;
            if (trimmedData.startsWith('```json') && trimmedData.endsWith('```')) {
                console.log('🧹 Detected markdown code block, cleaning...');
                // Remove ```json from start and ``` from end
                jsonContent = trimmedData.slice(7, -3).trim(); // Remove ```json (7 chars) and ``` (3 chars)
                console.log('✅ Markdown code block cleaned');
            }
            
            // Try to parse JSON
            try {
                    const cleanedJson = jsonContent.replace(/\s+/g, ' ').trim();
                    parsedData = JSON.parse(cleanedJson);
                    console.log('✅ JSON.parse successful after cleaning');
            } catch (jsonError) {
                console.warn('⚠️ Warning: Invalid JSON in PAIR response, treating as plain text');
                // If it's not valid JSON, treat it as a plain text message
                parsedData = {
                    message: trimmedData,
                    is_media: 0,
                    media_url: ''
                };
            }
        } else if (typeof responseData === 'object' && responseData !== null) {
            parsedData = responseData;
        } else {
            console.warn('⚠️ Warning: Invalid response data type:', typeof responseData);
            return {
                message: '',
                is_media: 0,
                media_url: '',
                hasMedia: false,
                isValid: false,
                error: 'Invalid response data type'
            };
        }
        
        // Extract the required fields with safe defaults
        const result = {
            message: parsedData.message || '',
            is_media: parsedData.is_media || 0,
            media_url: parsedData.media_url || '',
            hasMedia: (parsedData.is_media === 1 || parsedData.is_media === '1'),
            isValid: true
        };
        
        // Validate required fields
        if (!result.message) {
            console.warn('⚠️ Warning: PAIR response missing message field');
            result.isValid = false;
        }
        
        // Log parsing result
        console.log(`✅ PAIR response parsed successfully:`);
        console.log(`   📝 Message: "${result.message.substring(0, 100)}${result.message.length > 100 ? '...' : ''}"`);
        console.log(`   🎬 Has Media: ${result.hasMedia}`);
        if (result.hasMedia) {
            console.log(`   🔗 Media URL: ${result.media_url}`);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Error parsing PAIR response:', error);
        return {
            message: '',
            is_media: 0,
            media_url: '',
            hasMedia: false,
            isValid: false,
            error: error.message
        };
    }
}

// Serve the main HTML file first (before static middleware)
console.log("🌐 Setting up route handlers...");
app.get("/", (req, res) => {
  // console.log("📄 GET / - Serving home.html");
  console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);
  res.sendFile(path.join(__dirname, "home.html"));
});

app.post("/api/screen-dimensions", (req, res) => {
  const { width, height } = req.body;
  console.log("Screen dimensions:", { width, height });
  res.sendStatus(200);
});

app.post("/api/browser-info", (req, res) => {
  const { browserInfo, width, height } = req.body;
  console.log("Browser info:", browserInfo, "Dimensions:", width, height);
  res.sendStatus(200);
});

// Serve static files (but exclude HTML files from root to avoid conflicts)
app.use(
  express.static(".", {
    index: false, // Disable automatic index.html serving
  })
);
console.log("📁 Static file serving configured");

// Also serve home.html directly
app.get("/home", (req, res) => {
  // console.log("🏠 GET /home - Serving home.html");
  console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);
  res.sendFile(path.join(__dirname, "home.html"));
});

// API endpoint to get Azure Speech configuration
app.get("/api/speech-config", (req, res) => {
  console.log(
    "🎤 GET /api/speech-config - Azure Speech configuration requested"
  );
  console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);

  try {
    console.log(`🌍 Azure Speech Region: ${process.env.AZURE_SPEECH_REGION}`);

    // Return only the necessary configuration without exposing the full key
    const config = {
      region: process.env.AZURE_SPEECH_REGION,
      // We'll use a token-based approach for better security
      success: true,
    };

    console.log("✅ Speech configuration sent successfully");
    res.json(config);
  } catch (error) {
    console.error("❌ Error getting speech config:", error);
    res.status(500).json({ error: "Failed to get speech configuration" });
  }
});

// API endpoint to get Azure Speech token
app.post("/api/speech-token", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;

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
            res.json({
                token: token,
                region: process.env.AZURE_SPEECH_REGION
            });
        } else {
            throw new Error('Failed to get token');
        }
    } catch (error) {
        console.error('Error getting speech token:', error);
        res.status(500).json({ error: 'Failed to get speech token' });
    }
});

// API endpoint to proxy Azure Speech SDK to avoid CORS issues
app.get('/api/speech-sdk', async (req, res) => {
    try {
        console.log('🎤 GET /api/speech-sdk - Proxying Azure Speech SDK');
        const fetch = (await import('node-fetch')).default;
        
        // Try multiple CDN URLs
        const cdnUrls = [
            'https://aka.ms/csspeech/jsbrowserpackageraw',
            // 'https://csspeechstorage.blob.core.windows.net/drop/1.34.0/Microsoft.CognitiveServices.Speech.sdk.bundle.js'
        ];
        
        let sdkContent = null;
        let successUrl = null;
        
        for (const url of cdnUrls) {
            try {
                console.log(`📥 Trying to fetch Speech SDK from: ${url}`);
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                
                if (response.ok) {
                    sdkContent = await response.text();
                    successUrl = url;
                    console.log(`✅ Successfully fetched Speech SDK from: ${url}`);
                    break;
                } else {
                    console.log(`❌ Failed to fetch from ${url}: ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ Error fetching from ${url}:`, error.message);
            }
        }
        
        if (sdkContent) {
            // Set appropriate headers for JavaScript content
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            
            // Add a comment to indicate this is proxied
            const proxiedContent = `// Azure Speech SDK - Proxied through server to avoid CORS issues\n// Original source: ${successUrl}\n\n${sdkContent}`;
            
            res.send(proxiedContent);
            console.log('✅ Speech SDK served successfully via proxy');
        } else {
            throw new Error('Failed to fetch Speech SDK from all CDN URLs');
        }
    } catch (error) {
        console.error('❌ Error proxying Speech SDK:', error);
        res.status(500).json({ error: 'Failed to proxy Speech SDK' });
    }
});

// API endpoint to get PAIR-AVATAR configuration
app.get("/api/heygen-config", (req, res) => {
  console.log("🎭 GET /api/avatar-config - PAIR-AVATAR configuration requested");
  console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);

  try {
    const config = {
      avatarId: process.env.AVATAR_ID,
      voiceId: process.env.VOICE_ID,
      success: true,
    };

    console.log("✅ PAIR-AVATAR configuration sent successfully");
    res.json(config);
  } catch (error) {
    console.error("❌ Error getting PAIR-AVATAR config:", error);
    res.status(500).json({ error: "Failed to get PAIR-AVATAR configuration" });
  }
});

// API endpoint to create HeyGen session
app.post("/api/heygen-session", async (req, res) => {
  try {
    console.log("🎭 POST /api/avatar-session - Creating PAIR-AVATAR session");
    const fetch = (await import("node-fetch")).default;
    const { avatarId, voiceId } = req.body;

    if (!avatarId || !voiceId) {
      return res
        .status(400)
        .json({ error: "Avatar ID and Voice ID are required" });
    }

    const requestBody = {
      quality: "high",
      avatar_name: avatarId,
      voice: {
        voice_id: voiceId,
      },
    };

    console.log("📤 Sending request to HeyGen API...");
    const response = await fetch("https://api.heygen.com/v1/streaming.new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 PAIR-AVATAR API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PAIR-AVATAR API error:", errorText);
      throw new Error(`PAIR-AVATAR API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ PAIR-AVATAR session created successfully");

    if (data.data && data.data.session_id) {
      // Start keep-alive for the new session
      startKeepAlive(data.data.session_id);
      res.json(data.data);
    } else {
      throw new Error("Invalid response format from PAIR-AVATAR API");
    }
  } catch (error) {
    console.error("❌ Error creating PAIR-AVATAR session:", error);
    res.status(500).json({ error: "Failed to create PAIR-AVATAR session" });
  }
});

// API endpoint to start HeyGen session
app.post("/api/heygen-start", async (req, res) => {
  try {
    console.log("🎭 POST /api/avatar-start - Starting PAIR-AVATAR session");
    const fetch = (await import("node-fetch")).default;
    const { sessionId, sdp } = req.body;

    if (!sessionId || !sdp) {
      return res.status(400).json({ error: "Session ID and SDP are required" });
    }

    const response = await fetch("https://api.heygen.com/v1/streaming.start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify({ session_id: sessionId, sdp }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PAIR-AVATAR start session error:", errorText);
      throw new Error(`PAIR-AVATAR API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ PAIR-AVATAR session started successfully");
    res.json(data.data);
  } catch (error) {
    console.error("❌ Error starting PAIR-AVATAR session:", error);
    res.status(500).json({ error: "Failed to start PAIR-AVATAR session" });
  }
});

// API endpoint to handle ICE candidates
app.post("/api/heygen-ice", async (req, res) => {
  try {
    console.log("🧊 POST /api/avatar-ice - Handling ICE candidate");
    const fetch = (await import("node-fetch")).default;
    const { sessionId, candidate } = req.body;

    if (!sessionId || !candidate) {
      return res
        .status(400)
        .json({ error: "Session ID and candidate are required" });
    }

    const response = await fetch("https://api.heygen.com/v1/streaming.ice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify({ session_id: sessionId, candidate }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PAIR-AVATAR ICE error:", errorText);
      throw new Error(`PAIR-AVATAR API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Error handling ICE candidate:", error);
    res.status(500).json({ error: "Failed to handle ICE candidate" });
  }
});

// API endpoint to make avatar speak
app.post("/api/heygen-speak", async (req, res) => {
  try {
    console.log("🗣️ POST /api/avatar-speak - Making avatar speak");
    const fetch = (await import("node-fetch")).default;
    const { sessionId, text } = req.body;

    if (!sessionId || !text) {
      return res
        .status(400)
        .json({ error: "Session ID and text are required" });
    }

    console.log(
      `📢 Avatar speaking: "${text.substring(0, 50)}${
        text.length > 50 ? "..." : ""
      }"`
    );

    const response = await fetch("https://api.heygen.com/v1/streaming.task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify({ session_id: sessionId, text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PAIR-AVATAR speak error:", errorText);
      throw new Error(`PAIR-AVATAR API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Avatar speech task sent successfully");
    res.json(data.data);
  } catch (error) {
    console.error("❌ Error making avatar speak:", error);
    res.status(500).json({ error: "Failed to make avatar speak" });
  }
});

// API endpoint to stop HeyGen session
app.post("/api/heygen-stop", async (req, res) => {
  try {
    console.log("🛑 POST /api/avatar-stop - Stopping PAIR-AVATAR session");
    const fetch = (await import("node-fetch")).default;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const response = await fetch("https://api.heygen.com/v1/streaming.stop", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ PAIR-AVATAR stop session error:", errorText);
      throw new Error(`PAIR-AVATAR API error: ${response.status} ${errorText}`);
    }

        const data = await response.json();
        console.log('✅ PAIR-AVATAR session stopped successfully');
        
        // Stop keep-alive for this session
        stopKeepAlive(sessionId);
        
        res.json(data.data);
    } catch (error) {
        console.error('❌ Error stopping PAIR-AVATAR session:', error);
        res.status(500).json({ error: 'Failed to stop PAIR-AVATAR session' });
    }
});

// API endpoint for manual keep-alive
app.post("/api/heygen-keep-alive", async (req, res) => {
  try {
    console.log("💓 POST /api/heygen-keep-alive - Manual keep-alive request");
    const fetch = (await import("node-fetch")).default;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const response = await fetch("https://api.heygen.com/v1/streaming.keep_alive", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.HEYGEN_API_KEY,
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Manual keep-alive error:", errorText);
      throw new Error(`HeyGen API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Manual keep-alive successful");
    
    // Update session data if it exists
    if (activeSessions.has(sessionId)) {
      const sessionData = activeSessions.get(sessionId);
      sessionData.lastKeepAlive = new Date();
      activeSessions.set(sessionId, sessionData);
    }
    
    res.json(data);
  } catch (error) {
    console.error("❌ Error in manual keep-alive:", error);
    res.status(500).json({ error: "Failed to send keep-alive" });
  }
});

// API endpoint to get session status
app.get("/api/heygen-session-status/:sessionId", (req, res) => {
  try {
    console.log("📊 GET /api/heygen-session-status - Getting session status");
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const status = getSessionStatus(sessionId);
    console.log(`📊 Session ${sessionId} status:`, status);
    
    res.json({
      sessionId,
      ...status,
      totalActiveSessions: activeSessions.size
    });
  } catch (error) {
    console.error("❌ Error getting session status:", error);
    res.status(500).json({ error: "Failed to get session status" });
  }
});

// API endpoint to get all active sessions
app.get("/api/heygen-sessions", (req, res) => {
  try {
    console.log("📊 GET /api/heygen-sessions - Getting all active sessions");
    
    const sessions = Array.from(activeSessions.entries()).map(([sessionId, data]) => ({
      sessionId,
      createdAt: data.createdAt,
      lastKeepAlive: data.lastKeepAlive,
      uptime: Date.now() - data.createdAt.getTime()
    }));
    
    res.json({
      totalSessions: sessions.length,
      sessions
    });
  } catch (error) {
    console.error("❌ Error getting active sessions:", error);
    res.status(500).json({ error: "Failed to get active sessions" });
  }
});

// API endpoint to parse Dify response format
app.post('/api/parse-dify-response', (req, res) => {
    try {
        console.log('🔍 POST /api/parse-dify-response - Parsing PAIR response');
        console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);
        
        const { response } = req.body;
        
        if (!response) {
            return res.status(400).json({ error: 'Response data is required' });
        }
        
        // Parse the Dify response
        const parsedResult = parseDifyResponse(response);
        
        // Return the parsed result
        res.json({
            success: parsedResult.isValid,
            data: {
                message: parsedResult.message,
                is_media: parsedResult.is_media,
                media_url: parsedResult.media_url,
                hasMedia: parsedResult.hasMedia
            },
            error: parsedResult.error || null
        });
        
    } catch (error) {
        console.error('❌ Error in parse-PAIR-response endpoint:', error);
        res.status(500).json({ error: 'Failed to parse PAIR response' });
    }
});

// API endpoint to get LLM provider information
app.get("/api/llm-provider-info", (req, res) => {
  try {
    console.log("🤖 GET /api/llm-provider-info - LLM provider information requested");
    console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);

    const providerInfo = llmProvider.getProviderInfo();
    
    console.log("✅ LLM provider information sent successfully");
    res.json({
      success: true,
      data: providerInfo
    });
  } catch (error) {
    console.error("❌ Error getting LLM provider info:", error);
    res.status(500).json({ error: "Failed to get LLM provider information" });
  }
});

// API endpoint to send message to LLM (supports both Groq and Dify)
app.post("/api/llm-chat", async (req, res) => {
  try {
    const { message, userId = "default-user" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(`🤖 Processing message with ${llmProvider.provider.toUpperCase()} provider`);

    // Get or create conversation ID for this user
    let conversationId = userConversations.get(userId) || "";

    if (llmProvider.provider === 'groq') {
      // Handle Groq streaming response
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      });

      await llmProvider.streamGroqMessage(message, userId, conversationId, (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        
        if (data.type === 'message_end') {
          // Store conversation ID for future messages (for Groq, we'll use userId as conversation ID)
          userConversations.set(userId, userId);
          res.end();
        } else if (data.type === 'error') {
          res.end();
        }
      });

    } else if (llmProvider.provider === 'dify') {
      // For Dify, redirect to the existing dify-chat endpoint logic
      // We'll modify the existing endpoint to work with both
      return handleDifyRequest(req, res);
    } else {
      throw new Error(`Unsupported LLM provider: ${llmProvider.provider}`);
    }

  } catch (error) {
    console.error("Error in LLM chat:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process chat message" });
    }
  }
});

// Helper function for Dify requests
async function handleDifyRequest(req, res) {
  const fetch = (await import("node-fetch")).default;
  const { message, userId = "default-user" } = req.body;

  // Get or create conversation ID for this user
  let conversationId = userConversations.get(userId) || "";

  const difyPayload = {
    inputs: {},
    query: message,
    response_mode: "streaming",
    conversation_id: conversationId,
    user: userId,
    files: [],
  };

  const response = await fetch("https://api.dify.ai/v1/chat-messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DIFY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(difyPayload),
  });

  if (!response.ok) {
    throw new Error(
      `Dify API error: ${response.status} ${response.statusText}`
    );
  }

  // Set up Server-Sent Events
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  let fullAnswer = "";
  let currentConversationId = "";

  // Process the streaming response
  const reader = response.body;
  let buffer = '';
  
  reader.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    
    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '') continue; // Skip empty data lines
        
        try {
          const data = JSON.parse(jsonStr);
          
          if (data.event === 'message') {
            fullAnswer += data.answer;
            currentConversationId = data.conversation_id;
            
            // Send the streaming data to client
            res.write(`data: ${JSON.stringify({
              type: 'message',
              content: data.answer,
              conversation_id: data.conversation_id,
              provider: 'dify'
            })}\n\n`);
          } else if (data.event === 'message_end') {
            currentConversationId = data.conversation_id;
            
            // Store conversation ID for future messages
            if (currentConversationId) {
              userConversations.set(userId, currentConversationId);
            }
            
            // Parse the full answer using our response parser
            const parsedResponse = llmProvider.parseResponse(fullAnswer, 'dify', currentConversationId);
            
            // Send end event with parsed data
            res.write(`data: ${JSON.stringify({
              type: 'message_end',
              conversation_id: data.conversation_id,
              full_message: parsedResponse.message,
              has_media: parsedResponse.hasMedia,
              media_url: parsedResponse.media_url,
              parsed_response: parsedResponse,
              provider: 'dify'
            })}\n\n`);
            
            res.end();
          }
        } catch (parseError) {
          // Silently ignore parsing errors for incomplete JSON chunks
        }
      }
    }
  });

  reader.on("end", () => {
    if (!res.headersSent) {
      res.end();
    }
  });

  reader.on("error", (error) => {
    console.error("Stream error:", error);
    if (!res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Stream error occurred",
          provider: 'dify'
        })}\n\n`
      );
      res.end();
    }
  });
}

// API endpoint to send message to Dify (backward compatibility)
app.post("/api/dify-chat", async (req, res) => {
  try {
    console.log("🔄 Using legacy Dify endpoint - consider migrating to /api/llm-chat");
    await handleDifyRequest(req, res);
  } catch (error) {
    console.error("Error in Dify chat:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process chat message" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
