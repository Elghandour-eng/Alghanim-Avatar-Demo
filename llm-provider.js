const { Groq } = require('groq-sdk');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class LLMProvider {
    constructor() {
        this.provider = process.env.LLM_PROVIDER || 'dify';
        this.groqClient = null;
        this.systemPrompt = '';
        this.knowledgeBase = [];
        
        // Initialize Groq client if provider is groq
        if (this.provider === 'groq' && process.env.GROQ_API_KEY) {
            this.groqClient = new Groq({
                apiKey: process.env.GROQ_API_KEY
            });
        }
        
        // Load system prompt and knowledge base on initialization
        this.initializeProvider();
    }

    async initializeProvider() {
        try {
            console.log(`🤖 Initializing LLM Provider: ${this.provider.toUpperCase()}`);
            
            // Load system prompt from file
            await this.loadSystemPrompt();
            
            // Load knowledge base
            await this.loadKnowledgeBase();
            
            console.log(`✅ LLM Provider ${this.provider.toUpperCase()} initialized successfully`);
        } catch (error) {
            console.error('❌ Error initializing LLM Provider:', error);
        }
    }

    async loadSystemPrompt() {
        try {
            // Try to load from prompts/system-prompt.txt first
            const promptPaths = [
                path.join(__dirname, 'prompts', 'system-prompt.txt'),
                // path.join(__dirname, 'assets', 'css', 'prmpt.txt')
            ];
            
            for (const promptPath of promptPaths) {
                try {
                    this.systemPrompt = await fs.readFile(promptPath, 'utf8');
                    console.log(`📝 System prompt loaded from: ${promptPath}`);
                    return;
                } catch (fileError) {
                    // Continue to next path
                }
            }
            
            // Fallback to default system prompt
            this.systemPrompt = this.getDefaultSystemPrompt();
            console.log('📝 Using default system prompt (no files found)');
        } catch (error) {
            console.error('❌ Error loading system prompt:', error);
            this.systemPrompt = this.getDefaultSystemPrompt();
        }
    }

    async loadKnowledgeBase() {
        try {
            this.knowledgeBase = [];

            // Load from knowledge_base_formatted directory
            const kbDir = path.join(__dirname, 'knowledge_base_formatted');
            try {
                const kbFiles = await fs.readdir(kbDir);
                
                for (const file of kbFiles) {
                    if (file.endsWith('.md')) {
                        try {
                            const filePath = path.join(kbDir, file);
                            const content = await fs.readFile(filePath, 'utf8');
                            
                            this.knowledgeBase.push({
                                source: `knowledge_base_formatted/${file}`,
                                content: content,
                                type: 'markdown',
                                category: this.extractCategoryFromFilename(file)
                            });
                            
                            console.log(`📚 Loaded knowledge from: ${file}`);
                        } catch (fileError) {
                            console.log(`⚠️ Could not load knowledge from: ${file}`);
                        }
                    }
                }
            } catch (dirError) {
                console.log('⚠️ Knowledge base formatted directory not found, loading fallback sources');
            }

            // Load additional sources
            const additionalSources = [
                'assets/js/car-vocabulary.js',
                'DIFY_PARSER_README.md'
            ];

            for (const source of additionalSources) {
                try {
                    const filePath = path.join(__dirname, source);
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    this.knowledgeBase.push({
                        source: source,
                        content: content,
                        type: this.getFileType(source),
                        category: 'additional'
                    });
                    
                    console.log(`📚 Loaded additional knowledge from: ${source}`);
                } catch (fileError) {
                    console.log(`⚠️ Could not load additional knowledge from: ${source}`);
                }
            }

            console.log(`📚 Knowledge base loaded with ${this.knowledgeBase.length} sources`);
        } catch (error) {
            console.error('❌ Error loading knowledge base:', error);
        }
    }

    extractCategoryFromFilename(filename) {
        // Extract model name from filename like "cadillac_escalade_kb_formatted.md"
        const match = filename.match(/cadillac_([^_]+)/);
        return match ? match[1] : 'general';
    }

    getFileType(filename) {
        const ext = path.extname(filename).toLowerCase();
        switch (ext) {
            case '.js': return 'javascript';
            case '.md': return 'markdown';
            case '.txt': return 'text';
            case '.json': return 'json';
            default: return 'text';
        }
    }

    getDefaultSystemPrompt() {
        return `You are Layla, a helpful AI assistant for Cadillac cars. You speak Arabic and English fluently. 
You help customers learn about Cadillac vehicles, their features, specifications, and answer any questions they might have.
Always be friendly, professional, and knowledgeable about automotive topics.

Response Format:
Always respond in JSON format with the following structure:
{
    "message": "Your response message here",
    "is_media": 0 or 1 (1 if you're providing media content),
    "media_url": "URL to media if applicable, empty string otherwise"
}`;
    }

    buildContextualPrompt(userMessage) {
        let contextualPrompt = this.systemPrompt + '\n\n';
        
        // Add relevant knowledge base context
        if (this.knowledgeBase.length > 0) {
            contextualPrompt += 'KNOWLEDGE BASE:\n';
            
            // Find relevant knowledge based on user message
            const relevantKnowledge = this.findRelevantKnowledge(userMessage);
            
            relevantKnowledge.forEach(kb => {
                if (kb.type === 'markdown' && kb.source.includes('knowledge_base_formatted')) {
                    contextualPrompt += `${kb.category.toUpperCase()} Information:\n${kb.content.substring(0, 2000)}\n\n`;
                } else if (kb.type === 'javascript' && kb.source.includes('car-vocabulary')) {
                    contextualPrompt += `Car Vocabulary and Terms:\n${kb.content}\n\n`;
                } else if (kb.type === 'markdown' && kb.source.includes('README')) {
                    contextualPrompt += `System Documentation:\n${kb.content.substring(0, 1000)}\n\n`;
                }
            });
        }
        
        contextualPrompt += `User Message: ${userMessage}\n\n`;
        contextualPrompt += 'Please respond in the specified JSON format.';
        
        return contextualPrompt;
    }

    findRelevantKnowledge(userMessage) {
        const message = userMessage.toLowerCase();
        const relevantKnowledge = [];
        
        // Always include car vocabulary
        const vocabulary = this.knowledgeBase.find(kb => kb.source.includes('car-vocabulary'));
        if (vocabulary) relevantKnowledge.push(vocabulary);
        
        // Find relevant model-specific knowledge
        const modelKeywords = ['ct4', 'ct5', 'xt4', 'xt5', 'xt6', 'escalade', 'lyriq', 'optiq', 'vistiq'];
        
        for (const keyword of modelKeywords) {
            if (message.includes(keyword)) {
                const modelKb = this.knowledgeBase.find(kb =>
                    kb.source.includes(`cadillac_${keyword}_kb_formatted.md`)
                );
                if (modelKb) relevantKnowledge.push(modelKb);
            }
        }
        
        // If no specific model mentioned, include general knowledge (limit to 3 most relevant)
        if (relevantKnowledge.length <= 1) {
            const generalKb = this.knowledgeBase
                .filter(kb => kb.type === 'markdown' && kb.source.includes('knowledge_base_formatted'))
                .slice(0, 3);
            relevantKnowledge.push(...generalKb);
        }
        
        return relevantKnowledge;
    }

    async sendMessage(message, userId = 'default-user', conversationId = '') {
        try {
            console.log(`🤖 Processing message with ${this.provider.toUpperCase()} provider`);
            
            if (this.provider === 'groq') {
                return await this.sendGroqMessage(message, userId, conversationId);
            } else if (this.provider === 'dify') {
                return await this.sendDifyMessage(message, userId, conversationId);
            } else {
                throw new Error(`Unsupported LLM provider: ${this.provider}`);
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
            throw error;
        }
    }

    async sendGroqMessage(message, userId, conversationId) {
        try {
            if (!this.groqClient) {
                throw new Error('Groq client not initialized. Check GROQ_API_KEY.');
            }

            const contextualPrompt = this.buildContextualPrompt(message);
            
            console.log('🚀 Sending request to Groq API...');
            
            const completion = await this.groqClient.chat.completions.create({
                model: process.env.GROQ_MODEL || "moonshotai/kimi-k2-instruct-0905",
                messages: [
                    {
                        role: "system",
                        content: contextualPrompt
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: parseFloat(process.env.GROQ_TEMPERATURE) || 0.6,
                max_tokens: parseInt(process.env.GROQ_MAX_TOKENS) || 4096,
                top_p: parseFloat(process.env.GROQ_TOP_P) || 1,
                stream: false
            });

            const response = completion.choices[0]?.message?.content || '';
            
            console.log('✅ Groq API response received');
            
            // Parse the response using the existing Dify parser for consistency
            return this.parseResponse(response, 'groq');
            
        } catch (error) {
            console.error('❌ Groq API error:', error);
            throw error;
        }
    }

    async sendDifyMessage(message, userId, conversationId) {
        try {
            const fetch = (await import('node-fetch')).default;
            
            const difyPayload = {
                inputs: {},
                query: message,
                response_mode: "blocking", // Use blocking mode for consistency
                conversation_id: conversationId,
                user: userId,
                files: []
            };

            console.log('🚀 Sending request to Dify API...');

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

            const data = await response.json();
            console.log('✅ Dify API response received');
            
            return this.parseResponse(data.answer, 'dify', data.conversation_id);
            
        } catch (error) {
            console.error('❌ Dify API error:', error);
            throw error;
        }
    }

    parseResponse(responseData, provider, conversationId = '') {
        try {
            console.log(`🔍 Parsing ${provider.toUpperCase()} response:`, responseData);
            
            // Check if responseData is empty or null
            if (!responseData || responseData === '') {
                console.warn('⚠️ Warning: Empty response data');
                return {
                    message: '',
                    is_media: 0,
                    media_url: '',
                    hasMedia: false,
                    isValid: false,
                    error: 'Empty response data',
                    provider: provider,
                    conversation_id: conversationId
                };
            }
            
            // Handle both string and object inputs
            let parsedData;
            if (typeof responseData === 'string') {
                // Trim whitespace and check if string is empty
                const trimmedData = responseData.trim();
                if (trimmedData === '') {
                    console.warn('⚠️ Warning: Empty string response');
                    return {
                        message: '',
                        is_media: 0,
                        media_url: '',
                        hasMedia: false,
                        isValid: false,
                        error: 'Empty string response',
                        provider: provider,
                        conversation_id: conversationId
                    };
                }
                // Remove <think> tags and their content if present
                let jsonContent = trimmedData;
                if (jsonContent.includes('<think>')) {
                    console.log('🧹 Removing <think> tags...');
                    jsonContent = jsonContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                    console.log('✅ <think> tags removed');
                }
                
                // Check for markdown code block syntax and clean it
                if (jsonContent.startsWith('```json') && jsonContent.endsWith('```')) {
                    console.log('🧹 Detected markdown code block, cleaning...');
                    jsonContent = jsonContent.slice(7, -3).trim();
                    console.log('✅ Markdown code block cleaned');
                }
                
                // Try to parse JSON
                try {
                    const cleanedJson = jsonContent.replace(/\s+/g, ' ').trim();
                    parsedData = JSON.parse(cleanedJson);
                    console.log('✅ JSON.parse successful after cleaning');
                } catch (jsonError) {
                    console.warn('⚠️ Warning: Invalid JSON, treating as plain text');
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
                    error: 'Invalid response data type',
                    provider: provider,
                    conversation_id: conversationId
                };
            }
            
            // Extract the required fields with safe defaults
            // Handle both "message" and "answer" fields for compatibility
            const result = {
                message: parsedData.message || parsedData.answer || '',
                is_media: parsedData.is_media || 0,
                media_url: parsedData.media_url || '',
                hasMedia: (parsedData.is_media === 1 || parsedData.is_media === '1'),
                isValid: true,
                provider: provider,
                conversation_id: conversationId
            };
            
            // Validate required fields
            if (!result.message) {
                console.warn('⚠️ Warning: Response missing message field');
                result.isValid = false;
            }
            
            // Log parsing result
            console.log(`✅ ${provider.toUpperCase()} response parsed successfully:`);
            console.log(`   📝 Message: "${result.message.substring(0, 100)}${result.message.length > 100 ? '...' : ''}"`);
            console.log(`   🎬 Has Media: ${result.hasMedia}`);
            if (result.hasMedia) {
                console.log(`   🔗 Media URL: ${result.media_url}`);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Error parsing response:', error);
            return {
                message: '',
                is_media: 0,
                media_url: '',
                hasMedia: false,
                isValid: false,
                error: error.message,
                provider: provider,
                conversation_id: conversationId
            };
        }
    }

    async streamGroqMessage(message, userId, conversationId, responseCallback) {
        try {
            if (!this.groqClient) {
                throw new Error('Groq client not initialized. Check GROQ_API_KEY.');
            }

            const contextualPrompt = this.buildContextualPrompt(message);
            
            console.log('🚀 Starting Groq streaming...');
            
            const stream = await this.groqClient.chat.completions.create({
                model: process.env.GROQ_MODEL || "mixtral-8x7b-32768",
                messages: [
                    {
                        role: "system",
                        content: contextualPrompt
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                temperature: parseFloat(process.env.GROQ_TEMPERATURE) || 0.6,
                max_tokens: parseInt(process.env.GROQ_MAX_TOKENS) || 4096,
                top_p: parseFloat(process.env.GROQ_TOP_P) || 1,
                stream: true
            });

            let fullResponse = '';
            
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullResponse += content;
                    
                    // Send streaming data to callback
                    responseCallback({
                        type: 'message',
                        content: content,
                        provider: 'groq',
                        conversation_id: conversationId
                    });
                }
            }
            
            // Parse the full response and send end event
            const parsedResponse = this.parseResponse(fullResponse, 'groq', conversationId);
            
            responseCallback({
                type: 'message_end',
                conversation_id: conversationId,
                full_message: parsedResponse.message,
                has_media: parsedResponse.hasMedia,
                media_url: parsedResponse.media_url,
                parsed_response: parsedResponse,
                provider: 'groq'
            });
            
            console.log('✅ Groq streaming completed');
            
        } catch (error) {
            console.error('❌ Groq streaming error:', error);
            responseCallback({
                type: 'error',
                message: 'Groq streaming error occurred',
                error: error.message,
                provider: 'groq'
            });
        }
    }

    getProviderInfo() {
        return {
            provider: this.provider,
            hasSystemPrompt: !!this.systemPrompt,
            knowledgeBaseSize: this.knowledgeBase.length,
            groqConfigured: !!this.groqClient,
            difyConfigured: !!process.env.DIFY_API_KEY
        };
    }
}

module.exports = LLMProvider;