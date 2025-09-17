const express = require("express");
const cors = require("cors");
const path = require("path");
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
            
            // Try to parse JSON
            try {
                    const cleanedJson = trimmedData.replace(/\s+/g, ' ').trim();
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

    if (data.data) {
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
        res.json(data.data);
    } catch (error) {
        console.error('❌ Error stopping PAIR-AVATAR session:', error);
        res.status(500).json({ error: 'Failed to stop PAIR-AVATAR session' });
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

// API endpoint to send message to Dify
app.post("/api/dify-chat", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;
    const { message, userId = "default-user" } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

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
        `PAIR API error: ${response.status} ${response.statusText}`
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
                                conversation_id: data.conversation_id
                            })}\n\n`);
                        } else if (data.event === 'message_end') {
                            currentConversationId = data.conversation_id;
                            
                            // Store conversation ID for future messages
                            if (currentConversationId) {
                                userConversations.set(userId, currentConversationId);
                            }
                            
                            // Parse the full answer using our Dify response parser
                            let parsedDifyResponse = null;
                            let screenType = 'default';
                            let cleanAnswer = fullAnswer;
                            
                            try {
                                // Try to parse as the new Dify response format
                                parsedDifyResponse = parseDifyResponse(fullAnswer);
                                if (parsedDifyResponse.isValid) {
                                    cleanAnswer = parsedDifyResponse.message;
                                    // Check if it has media
                                    if (parsedDifyResponse.hasMedia) {
                                        console.log('📎 Media detected in PAIR response');
                                    }
                                }
                            } catch (jsonError) {
                                // Fallback: try to parse as the old format
                                try {
                                    const oldFormat = JSON.parse(fullAnswer);
                                    if (oldFormat.answer) {
                                        cleanAnswer = oldFormat.answer;
                                    }
                                    if (oldFormat.screen) {
                                        screenType = oldFormat.screen;
                                    }
                                } catch (oldFormatError) {
                                    // If neither format works, use the full answer as is
                                    cleanAnswer = fullAnswer;
                                }
                            }
                            
                            // Send end event with parsed data
                            res.write(`data: ${JSON.stringify({
                                type: 'message_end',
                                conversation_id: data.conversation_id,
                                full_message: cleanAnswer,
                                screen: screenType,
                                has_media: parsedDifyResponse?.hasMedia || false,
                                media_url: parsedDifyResponse?.media_url || '',
                                parsed_response: parsedDifyResponse || null
                            })}\n\n`);
                            
                            res.end();
                        } else if (data.event === 'tts_message') {
                            // Handle TTS if needed
                            res.write(`data: ${JSON.stringify({
                                type: 'tts_message',
                                audio: data.audio,
                                conversation_id: data.conversation_id
                            })}\n\n`);
                        } else if (data.event === 'tts_message_end') {
                            // Handle TTS end if needed
                            res.write(`data: ${JSON.stringify({
                                type: 'tts_message_end',
                                conversation_id: data.conversation_id
                            })}\n\n`);
                        }
                    } catch (parseError) {
                        // Silently ignore parsing errors for incomplete JSON chunks
                        // console.error('Error parsing Dify response:', parseError);
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
          })}\n\n`
        );
        res.end();
      }
    });
  } catch (error) {
    console.error("Error in PAIR chat:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process chat message" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
