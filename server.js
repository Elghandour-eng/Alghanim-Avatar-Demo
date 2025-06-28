const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

console.log('🚀 Starting Alghanim Avatar Demo Server...');
console.log('📋 Environment variables loaded');
console.log(`🔧 Node environment: ${process.env.NODE_ENV || 'development'}`);

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`⚙️  Server will run on port: ${PORT}`);

// Middleware
console.log('🔧 Setting up middleware...');
app.use(cors());
console.log('✅ CORS middleware enabled');

app.use(express.json());
console.log('✅ JSON parsing middleware enabled');

// Store conversation IDs for users (in production, use a proper database)
const userConversations = new Map();
console.log('💾 User conversations storage initialized');

// Serve the main HTML file first (before static middleware)
console.log('🌐 Setting up route handlers...');
app.get('/', (req, res) => {
    console.log('📄 GET / - Serving home.html');
    console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Serve static files (but exclude HTML files from root to avoid conflicts)
app.use(express.static('.', {
    index: false // Disable automatic index.html serving
}));
console.log('📁 Static file serving configured');

// Also serve home.html directly
app.get('/home', (req, res) => {
    console.log('🏠 GET /home - Serving home.html');
    console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);
    res.sendFile(path.join(__dirname, 'home.html'));
});

// API endpoint to get Azure Speech configuration
app.get('/api/speech-config', (req, res) => {
    console.log('🎤 GET /api/speech-config - Azure Speech configuration requested');
    console.log(`🔍 Request from IP: ${req.ip || req.connection.remoteAddress}`);
    
    try {
        console.log(`🌍 Azure Speech Region: ${process.env.AZURE_SPEECH_REGION}`);
        
        // Return only the necessary configuration without exposing the full key
        const config = {
            region: process.env.AZURE_SPEECH_REGION,
            // We'll use a token-based approach for better security
            success: true
        };
        
        console.log('✅ Speech configuration sent successfully');
        res.json(config);
    } catch (error) {
        console.error('❌ Error getting speech config:', error);
        res.status(500).json({ error: 'Failed to get speech configuration' });
    }
});

// API endpoint to get Azure Speech token
app.post('/api/speech-token', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        
        const tokenUrl = `https://${process.env.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
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

// API endpoint to send message to Dify
app.post('/api/dify-chat', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const { message, userId = 'default-user' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Get or create conversation ID for this user
        let conversationId = userConversations.get(userId) || "";

        const difyPayload = {
            inputs: {},
            query: message,
            response_mode: "streaming",
            conversation_id: conversationId,
            user: userId,
            files: []
        };

        const response = await fetch('https://api.dify.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(difyPayload)
        });

        if (!response.ok) {
            throw new Error(`Dify API error: ${response.status} ${response.statusText}`);
        }

        // Set up Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        let fullAnswer = '';
        let currentConversationId = '';

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
                            
                            // Try to parse the full answer as JSON to extract screen info
                            let parsedAnswer = null;
                            let screenType = 'default';
                            let cleanAnswer = fullAnswer;
                            
                            try {
                                // Try to parse as JSON
                                parsedAnswer = JSON.parse(fullAnswer);
                                if (parsedAnswer.answer) {
                                    cleanAnswer = parsedAnswer.answer;
                                }
                                if (parsedAnswer.screen) {
                                    screenType = parsedAnswer.screen;
                                }
                            } catch (jsonError) {
                                // If not JSON, use the full answer as is
                                cleanAnswer = fullAnswer;
                            }
                            
                            // Send end event with parsed data
                            res.write(`data: ${JSON.stringify({
                                type: 'message_end',
                                conversation_id: data.conversation_id,
                                full_message: cleanAnswer,
                                screen: screenType
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

        reader.on('end', () => {
            if (!res.headersSent) {
                res.end();
            }
        });

        reader.on('error', (error) => {
            console.error('Stream error:', error);
            if (!res.headersSent) {
                res.write(`data: ${JSON.stringify({
                    type: 'error',
                    message: 'Stream error occurred'
                })}\n\n`);
                res.end();
            }
        });

    } catch (error) {
        console.error('Error in Dify chat:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process chat message' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
