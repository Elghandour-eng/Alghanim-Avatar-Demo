# LLM Provider System Documentation

## Overview

This system provides a unified interface for multiple LLM providers (Groq and Dify) with file system-based prompts and knowledge base integration. The system automatically loads prompts and knowledge base files from the file system, making it easy to customize and maintain.

## Features

- ✅ **Multi-Provider Support**: Switch between Groq and Dify providers
- ✅ **File System Prompts**: Load system prompts from external files
- ✅ **Knowledge Base Integration**: Automatic loading of formatted knowledge base files
- ✅ **Streaming Support**: Real-time streaming responses for both providers
- ✅ **Response Parsing**: Unified response format with media support
- ✅ **Environment Configuration**: Easy configuration via environment variables

## Architecture

```
├── llm-provider.js           # Main LLM provider service
├── server.js                 # Express server with API endpoints
├── test-llm-providers.js     # Testing utilities
├── prompts/
│   └── system-prompt.txt     # System prompt file
├── knowledge_base_formatted/
│   ├── cadillac_ct5_kb_formatted.md
│   ├── cadillac_escalade_kb_formatted.md
│   └── ... (other model files)
└── .env                      # Environment configuration
```

## Environment Variables

### Required Variables
```env
LLM_PROVIDER=groq              # or 'dify'
GROQ_API_KEY=your_groq_key     # Required for Groq provider
DIFY_API_KEY=your_dify_key     # Required for Dify provider
```

### Optional Groq Configuration
```env
GROQ_MODEL=moonshotai/kimi-k2-instruct-0905  # Default model
GROQ_TEMPERATURE=0.6                          # Response creativity
GROQ_MAX_TOKENS=4096                          # Maximum response length
GROQ_TOP_P=1                                  # Nucleus sampling parameter
```

## API Endpoints

### 1. Get LLM Provider Information
```http
GET /api/llm-provider-info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": "groq",
    "hasSystemPrompt": true,
    "knowledgeBaseSize": 12,
    "groqConfigured": true,
    "difyConfigured": true
  }
}
```

### 2. Send Message to LLM (Unified Endpoint)
```http
POST /api/llm-chat
Content-Type: application/json

{
  "message": "Hello! Tell me about Cadillac cars.",
  "userId": "user123"
}
```

**Streaming Response:**
```
data: {"type":"message","content":"Hello! ","provider":"groq"}
data: {"type":"message","content":"I'm here to help...","provider":"groq"}
data: {"type":"message_end","full_message":"Complete response","has_media":false,"provider":"groq"}
```

### 3. Legacy Dify Endpoint (Backward Compatibility)
```http
POST /api/dify-chat
Content-Type: application/json

{
  "message": "Hello! Tell me about Cadillac cars.",
  "userId": "user123"
}
```

## Response Format

All LLM responses follow this unified format:

```json
{
  "message": "Response text here",
  "is_media": 0,
  "media_url": "",
  "hasMedia": false,
  "isValid": true,
  "provider": "groq",
  "conversation_id": "conversation-id"
}
```

### Media Response Example
```json
{
  "message": "Here's a video about the Cadillac Escalade",
  "is_media": 1,
  "media_url": "https://example.com/escalade-video.mp4",
  "hasMedia": true,
  "isValid": true,
  "provider": "groq",
  "conversation_id": "conversation-id"
}
```

## File System Integration

### System Prompts

The system loads prompts from:
1. `prompts/system-prompt.txt` (primary)
2. Falls back to default prompt if file not found

**Example system prompt structure:**
```
You are Layla, a helpful AI assistant for Cadillac cars...

Response Format:
Always respond in JSON format with the following structure:
{
    "message": "Your response message here",
    "is_media": 0 or 1,
    "media_url": "URL to media if applicable"
}
```

### Knowledge Base

The system automatically loads knowledge from:
- `knowledge_base_formatted/*.md` - Cadillac model-specific information
- `assets/js/car-vocabulary.js` - Car terminology and vocabulary
- `DIFY_PARSER_README.md` - System documentation

**Knowledge Base Features:**
- **Smart Loading**: Automatically discovers and loads all `.md` files
- **Contextual Relevance**: Selects relevant knowledge based on user queries
- **Model-Specific**: Loads specific model information when mentioned
- **Fallback**: Includes general knowledge when no specific model is mentioned

## Usage Examples

### 1. Basic Setup
```javascript
const LLMProvider = require('./llm-provider');

// Initialize provider (reads from environment variables)
const llmProvider = new LLMProvider();

// Wait for initialization
await new Promise(resolve => setTimeout(resolve, 2000));
```

### 2. Send Message
```javascript
// For Groq (streaming)
if (llmProvider.provider === 'groq') {
    await llmProvider.streamGroqMessage(message, userId, conversationId, (data) => {
        if (data.type === 'message') {
            console.log(data.content);
        } else if (data.type === 'message_end') {
            console.log('Complete response:', data.full_message);
        }
    });
}

// For Dify (blocking)
if (llmProvider.provider === 'dify') {
    const response = await llmProvider.sendDifyMessage(message, userId, conversationId);
    console.log('Response:', response.message);
}
```

### 3. Get Provider Information
```javascript
const info = llmProvider.getProviderInfo();
console.log('Current provider:', info.provider);
console.log('Knowledge base size:', info.knowledgeBaseSize);
```

## Testing

### Run Tests
```bash
# Test current provider
node test-llm-providers.js

# Test both providers
node test-llm-providers.js --both

# Validate environment
node test-llm-providers.js --validate

# Show API examples
node test-llm-providers.js --examples
```

### Test Output Example
```
🧪 Starting LLM Provider Tests

📋 Current LLM Provider: groq
🤖 Initializing LLM Provider: GROQ
📝 System prompt loaded from: prompts/system-prompt.txt
📚 Loaded knowledge from: cadillac_escalade_kb_formatted.md
📚 Knowledge base loaded with 12 sources
✅ LLM Provider GROQ initialized successfully
```

## Switching Providers

### Switch to Groq
```env
LLM_PROVIDER=groq
```

### Switch to Dify
```env
LLM_PROVIDER=dify
```

The system will automatically:
- Initialize the correct provider
- Load appropriate configurations
- Handle provider-specific response formats
- Maintain the same API interface

## Customization

### Custom System Prompt
1. Edit `prompts/system-prompt.txt`
2. Restart the application
3. The new prompt will be automatically loaded

### Custom Knowledge Base
1. Add `.md` files to `knowledge_base_formatted/`
2. Follow naming convention: `cadillac_[model]_kb_formatted.md`
3. Restart the application
4. Files will be automatically discovered and loaded

### Model-Specific Knowledge
The system automatically loads relevant knowledge based on user queries:
- Mentions "escalade" → loads `cadillac_escalade_kb_formatted.md`
- Mentions "ct5" → loads `cadillac_ct5_kb_formatted.md`
- General queries → loads multiple relevant files

## Error Handling

The system includes comprehensive error handling:
- **Missing API Keys**: Graceful fallback with clear error messages
- **File Loading Errors**: Falls back to default prompts/knowledge
- **API Failures**: Proper error responses with debugging information
- **Invalid Responses**: Response validation and parsing error handling

## Performance Considerations

- **Knowledge Base Size**: Large knowledge bases are truncated to prevent token limits
- **Contextual Loading**: Only relevant knowledge is included in prompts
- **Streaming**: Groq responses are streamed for better user experience
- **Caching**: System prompts and knowledge base are cached in memory

## Troubleshooting

### Common Issues

1. **Provider not working**
   - Check API keys in `.env` file
   - Verify `LLM_PROVIDER` setting
   - Run validation: `node test-llm-providers.js --validate`

2. **Knowledge base not loading**
   - Check file permissions
   - Verify file naming convention
   - Check console logs for loading errors

3. **Responses not formatted correctly**
   - Check system prompt format
   - Verify JSON response structure
   - Test with simple queries first

### Debug Commands
```bash
# Check environment
node test-llm-providers.js --validate

# Test specific provider
LLM_PROVIDER=groq node test-llm-providers.js

# View API examples
node test-llm-providers.js --examples
```

## Contributing

When adding new features:
1. Update the LLM provider class
2. Add corresponding tests
3. Update this documentation
4. Test with both providers
5. Ensure backward compatibility

## License

This project is part of the Alghanim Avatar Demo system.