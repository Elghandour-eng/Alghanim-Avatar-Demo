# Dify Response Parser

This document explains how to use the Dify response parsing functionality implemented in the Alghanim Avatar Demo project.

## Overview

The Dify Response Parser handles responses from Dify AI in a specific JSON format that includes message content and optional media attachments. It provides both a standalone parsing function and API endpoints for integration.

## Response Format

The parser expects responses in the following JSON format:

### Text-Only Response
```json
{
  "message": "حياك الله! أنا ليلى، شسمك؟ تفضل علّمني شنو تبي تعرف عن كاديلاك اليوم!",
  "is_media": 0,
  "media_url": ""
}
```

### Response with Media
```json
{
  "message": "هذا فيديو عن سيارة كاديلاك الجديدة",
  "is_media": 1,
  "media_url": "https://example.com/cadillac-video.mp4"
}
```

## Features

- ✅ Parses both string and object inputs
- ✅ Handles text-only responses
- ✅ Handles responses with media attachments
- ✅ Validates response structure
- ✅ Provides detailed logging
- ✅ Error handling with fallback
- ✅ Arabic text support
- ✅ Integration with existing Dify chat endpoint

## API Endpoints

### 1. Parse Dify Response
**Endpoint:** `POST /api/parse-dify-response`

**Purpose:** Parse a Dify response and extract structured data.

**Request Body:**
```json
{
  "response": {
    "message": "Your message here",
    "is_media": 0,
    "media_url": ""
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Your message here",
    "is_media": 0,
    "media_url": "",
    "hasMedia": false
  },
  "error": null
}
```

### 2. Enhanced Dify Chat
**Endpoint:** `POST /api/dify-chat`

The existing Dify chat endpoint has been enhanced to automatically parse responses using the new parser. It now includes additional fields in the response:

```json
{
  "type": "message_end",
  "conversation_id": "conv_123",
  "full_message": "Parsed message content",
  "screen": "default",
  "has_media": false,
  "media_url": "",
  "parsed_response": {
    "message": "Parsed message content",
    "is_media": 0,
    "media_url": "",
    "hasMedia": false,
    "isValid": true
  }
}
```

## Usage Examples

### 1. Using the API Endpoint

#### cURL Example
```bash
# Test text-only response
curl -X POST http://localhost:3000/api/parse-dify-response \
  -H "Content-Type: application/json" \
  -d '{
    "response": {
      "message": "مرحبا بك في عالم كاديلاك",
      "is_media": 0,
      "media_url": ""
    }
  }'

# Test response with media
curl -X POST http://localhost:3000/api/parse-dify-response \
  -H "Content-Type: application/json" \
  -d '{
    "response": {
      "message": "هذا فيديو عن سيارة كاديلاك الجديدة",
      "is_media": 1,
      "media_url": "https://example.com/video.mp4"
    }
  }'
```

#### JavaScript/Fetch Example
```javascript
async function parseDifyResponse(responseData) {
    try {
        const response = await fetch('/api/parse-dify-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ response: responseData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Message:', result.data.message);
            console.log('Has Media:', result.data.hasMedia);
            
            if (result.data.hasMedia) {
                console.log('Media URL:', result.data.media_url);
                displayMedia(result.data.media_url);
            } else {
                displayTextMessage(result.data.message);
            }
        } else {
            console.error('Parsing failed:', result.error);
        }
    } catch (error) {
        console.error('API call failed:', error);
    }
}
```

### 2. Direct Function Usage

```javascript
// Import the function (if using as a module)
const { parseDifyResponse } = require('./server.js');

// Example usage
const difyResponse = {
    "message": "أهلاً وسهلاً! كيف يمكنني مساعدتك اليوم؟",
    "is_media": 0,
    "media_url": ""
};

const parsed = parseDifyResponse(difyResponse);
console.log(parsed);
// Output:
// {
//   message: "أهلاً وسهلاً! كيف يمكنني مساعدتك اليوم؟",
//   is_media: 0,
//   media_url: "",
//   hasMedia: false,
//   isValid: true
// }
```

## Testing

### Running Tests
```bash
# Run the test file
node test-dify-parser.js
```

### Test Cases Included
1. **Text-only response** - Standard message without media
2. **Response with media** - Message with video/image attachment
3. **Media without URL** - Media flag set but no URL provided
4. **Invalid response** - Missing required fields
5. **String format** - JSON string input instead of object

## Error Handling

The parser includes comprehensive error handling:

### Validation Errors
- Missing `message` field
- Invalid JSON format
- Malformed response structure

### Error Response Format
```json
{
  "success": false,
  "data": {
    "message": "",
    "is_media": 0,
    "media_url": "",
    "hasMedia": false
  },
  "error": "Error description here"
}
```

## Integration with Frontend

### Media Display Logic
```javascript
function displayMedia(mediaUrl) {
    if (mediaUrl.includes('.mp4') || mediaUrl.includes('.webm')) {
        // Display video
        const video = document.createElement('video');
        video.src = mediaUrl;
        video.controls = true;
        video.className = 'chat-media-video';
        document.getElementById('chat-container').appendChild(video);
    } else if (mediaUrl.includes('.jpg') || mediaUrl.includes('.png') || mediaUrl.includes('.gif')) {
        // Display image
        const img = document.createElement('img');
        img.src = mediaUrl;
        img.className = 'chat-media-image';
        img.style.maxWidth = '100%';
        document.getElementById('chat-container').appendChild(img);
    } else {
        // Display as link for other media types
        const link = document.createElement('a');
        link.href = mediaUrl;
        link.textContent = 'View Media';
        link.target = '_blank';
        link.className = 'chat-media-link';
        document.getElementById('chat-container').appendChild(link);
    }
}

function displayTextMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = 'chat-message';
    document.getElementById('chat-container').appendChild(messageDiv);
}
```

### Event Handling for Streaming Responses
```javascript
// Listen for Dify chat responses
const eventSource = new EventSource('/api/dify-chat');

eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    if (data.type === 'message_end') {
        // Use the parsed response data
        if (data.has_media) {
            displayMedia(data.media_url);
        } else {
            displayTextMessage(data.full_message);
        }
    }
};
```

## Logging

The parser provides detailed console logging:

```
🔍 Parsing Dify response: {"message":"مرحبا","is_media":0,"media_url":""}
✅ Dify response parsed successfully:
   📝 Message: "مرحبا"
   🎬 Has Media: false
```

For media responses:
```
🔍 Parsing Dify response: {"message":"فيديو","is_media":1,"media_url":"video.mp4"}
✅ Dify response parsed successfully:
   📝 Message: "فيديو"
   🎬 Has Media: true
   🔗 Media URL: video.mp4
📎 Media detected in Dify response
```

## Configuration

No additional configuration is required. The parser works out of the box with the existing server setup.

## Troubleshooting

### Common Issues

1. **Invalid JSON Format**
   - Ensure the response is valid JSON
   - Check for missing quotes or commas

2. **Missing Message Field**
   - The parser will mark the response as invalid
   - Check the `isValid` field in the result

3. **Media Not Displaying**
   - Verify the `media_url` is accessible
   - Check CORS settings for external media URLs
   - Ensure proper media type detection in frontend

### Debug Mode
Enable detailed logging by checking the server console output when parsing responses.

## Future Enhancements

Potential improvements for the parser:

- [ ] Support for multiple media attachments
- [ ] Media type validation
- [ ] Automatic media thumbnail generation
- [ ] Response caching
- [ ] Batch parsing support
- [ ] Custom validation rules
- [ ] Response transformation hooks

## Support

For issues or questions regarding the Dify Response Parser, please check:

1. Server console logs for detailed error information
2. Test file (`test-dify-parser.js`) for usage examples
3. API response format documentation above

---

**Last Updated:** January 2025  
**Version:** 1.0.0
